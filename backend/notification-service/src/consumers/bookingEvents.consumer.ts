import amqp from 'amqplib';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
const EXCHANGE_NAME = 'distrbook.booking.events';
const QUEUE_NAME = 'distrbook.notification.queue';

// Distributed Systems: Lamport Logical Clock (In-Memory Monotonic Counter)
let notificationLamportClock = 0;

export function getLamportClock(): number {
  return notificationLamportClock;
}

export function resetLamportClock(val = 0): void {
  notificationLamportClock = val;
}

export async function startNotificationConsumer() {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();

    await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });
    await channel.assertQueue(QUEUE_NAME, { durable: true });

    // Bind to all keys under distrbook.booking.events
    await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, '#');

    console.log(`Notification Service consumer listening on queue ${QUEUE_NAME}...`);

    channel.consume(QUEUE_NAME, async (msg) => {
      if (!msg) return;

      try {
        const content = JSON.parse(msg.content.toString());
        const eventType = msg.properties.headers?.['event-type'] || 'BOOKING_CREATED';

        // Lamport Receive Rule: L_j = max(L_j, L_msg) + 1
        const rawIncoming = msg.properties.headers?.['lamport-clock'] ?? content.lamportClock;
        const incomingClock = (typeof rawIncoming === 'number' && !isNaN(rawIncoming)) ? rawIncoming : 0;
        notificationLamportClock = Math.max(notificationLamportClock, incomingClock) + 1;
        const currentLamport = notificationLamportClock;

        console.log(`[Notification Consumer] [Lamport Clock: L=${currentLamport}] Received event ${eventType} (incoming L=${incomingClock}):`, content);

        const notifications: Array<{ userEmail: string; title: string; message: string }> = [];
        const resourceId = content.resourceId;
        const dateDisplay = (content.startDate && content.endDate)
          ? `${content.startDate} to ${content.endDate}`
          : content.date;
        const timeDisplay = `${content.startTime}–${content.endTime}`;
        
// Determine secondary approver (Coordinator or Lab Assistant) by fetching the resource details
        let secondaryEmail = '';
        let secondaryTitle = '';
        try {
          const axios = require('axios');
          const resourceServiceUrl = process.env.RESOURCE_SERVICE_URL || 'http://resource-service:3001';
          const res = await axios.get(`${resourceServiceUrl}/resources/${resourceId}`, {
            headers: { 'X-User-Email': 'admin@pccoepune.org' }
          });
          const resource = res.data;
          // Determine secondary approver with laboratory priority
          const typeLower = (resource.type || '').toLowerCase();
          if (typeLower.includes('lab')) {
            secondaryEmail = 'labassistant@pccoepune.org';
            secondaryTitle = 'Lab Assistant';
          } else if (resource.coordinatorEmail) {
            secondaryEmail = resource.coordinatorEmail;
            secondaryTitle = 'Hall Coordinator';
          } else {
            secondaryEmail = '';
            secondaryTitle = '';
          }
        } catch (e) {
          const err = e as any;
          console.error('Failed to fetch resource for notification routing:', err.message);
          // Fallback heuristic based on resourceId
          if (resourceId.toUpperCase().includes('LAB') || resourceId.toUpperCase().includes('LA')) {
            secondaryEmail = 'labassistant@pccoepune.org';
            secondaryTitle = 'Lab Assistant';
          } else {
            secondaryEmail = 'coordinator@pccoepune.org';
            secondaryTitle = 'Hall Coordinator';
          }
        }

        switch (eventType) {
          case 'BOOKING_CREATED':
            // Send request alert to student
            notifications.push({
              userEmail: content.userEmail,
              title: `[L=${currentLamport}] Booking Request Submitted`,
              message: `Your booking request for ${resourceId} on ${dateDisplay} (${timeDisplay}) has been submitted.`
            });

            // Send alert to faculty if required and not approved
            if (content.facultyEmail && !content.facultyApproved) {
              notifications.push({
                userEmail: content.facultyEmail,
                title: `[L=${currentLamport}] Student request requires your approval`,
                message: `${content.userName} requested ${resourceId} under your in-charge for "${content.purpose}" on ${dateDisplay}.`
              });
            } else {
              // Direct routing to Coordinator/Lab Assistant if no faculty required
              if (content.status === 'pending') {
                notifications.push({
                  userEmail: secondaryEmail,
                  title: `[L=${currentLamport}] ${secondaryTitle} Approval Required`,
                  message: `New booking request for controlled resource ${resourceId} requires your approval.`
                });
              }
            }
            break;

          case 'BOOKING_FACULTY_APPROVED':
            notifications.push({
              userEmail: content.userEmail,
              title: `[L=${currentLamport}] Faculty Approved Request`,
              message: `Faculty approved your request for ${resourceId}. It is now awaiting ${secondaryTitle} approval.`
            });
            notifications.push({
              userEmail: secondaryEmail,
              title: `[L=${currentLamport}] Faculty-Approved Request Requires Approval`,
              message: `Faculty approved student request for ${resourceId} on ${dateDisplay}. Requires your approval.`
            });
            break;

          case 'BOOKING_COORDINATOR_APPROVED':
          case 'BOOKING_LAB_APPROVED':
          case 'ADMIN_APPROVED':
            notifications.push({
              userEmail: content.userEmail,
              title: `[L=${currentLamport}] Booking Approved`,
              message: `Your booking request for ${resourceId} on ${dateDisplay} from ${content.startTime} to ${content.endTime} has been approved.`
            });
            break;

          case 'BOOKING_REJECTED':
            notifications.push({
              userEmail: content.userEmail,
              title: `[L=${currentLamport}] Booking Rejected`,
              message: `Your booking request for ${resourceId} on ${dateDisplay} was rejected. Reason: ${content.rejectionReason || 'Rejected'}`
            });
            break;

          case 'BOOKING_CANCELLED':
            notifications.push({
              userEmail: content.userEmail,
              title: `[L=${currentLamport}] Booking Cancelled`,
              message: `Booking for ${resourceId} on ${dateDisplay} was cancelled.`
            });
            break;
        }

        // Persist notifications
        for (const notif of notifications) {
          await prisma.notification.create({
            data: {
              bookingId: content.id,
              userEmail: notif.userEmail,
              type: eventType,
              title: notif.title,
              message: notif.message,
              status: 'UNREAD'
            }
          });
        }

        channel.ack(msg);
      } catch (error: any) {
        console.error('Error processing notification event:', error.message);
        // Nack and requeue message
        channel.nack(msg, false, true);
      }
    });

  } catch (error: any) {
    console.error('RabbitMQ consumer setup failed:', error.message);
    console.log('Retrying consumer setup in 5 seconds...');
    setTimeout(startNotificationConsumer, 5000);
  }
}

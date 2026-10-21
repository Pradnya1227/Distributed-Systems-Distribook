import { connect, Connection, Channel } from 'amqplib';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
const EXCHANGE_NAME = 'distrbook.booking.events';

let channel: any = null;
let connection: any = null;

export async function connectRabbitMQ() {
  try {
    connection = await connect(RABBITMQ_URL);
    channel = await connection.createChannel();
    await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });
    console.log('Successfully connected to RabbitMQ and asserted exchange.');
  } catch (error: any) {
    console.error('Failed to connect to RabbitMQ:', error.message);
    console.log('Retrying RabbitMQ connection in 5 seconds...');
    setTimeout(connectRabbitMQ, 5000);
  }
}

<<<<<<< HEAD
// Distributed Systems: Lamport Logical Clock (In-Memory Monotonic Counter)
let lamportClock = 0;

export function getLamportClock(): number {
  return lamportClock;
}

export function resetLamportClock(val = 0): void {
  lamportClock = val;
}

=======
>>>>>>> origin/main
export async function publishBookingEvent(eventType: string, payload: any) {
  if (!channel) {
    console.warn('RabbitMQ channel not initialized. Event skipped:', eventType);
    return;
  }
  try {
<<<<<<< HEAD
    // Lamport Send Rule: L_i = L_i + 1 before sending message
    lamportClock += 1;
    const currentClock = lamportClock;

    const routingKey = eventType.toLowerCase().replace(/_/g, '.');
    const enrichedPayload = { ...payload, lamportClock: currentClock };
    const messageBuffer = Buffer.from(JSON.stringify(enrichedPayload));

    channel.publish(EXCHANGE_NAME, routingKey, messageBuffer, {
      persistent: true,
      headers: {
        'event-type': eventType,
        'lamport-clock': currentClock
      }
    });
    console.log(`[Lamport Clock: L=${currentClock}] Published event ${eventType} to exchange ${EXCHANGE_NAME} with key ${routingKey}`);
=======
    const routingKey = eventType.toLowerCase().replace(/_/g, '.');
    const messageBuffer = Buffer.from(JSON.stringify(payload));
    channel.publish(EXCHANGE_NAME, routingKey, messageBuffer, {
      persistent: true,
      headers: { 'event-type': eventType }
    });
    console.log(`Published event ${eventType} to exchange ${EXCHANGE_NAME} with key ${routingKey}`);
>>>>>>> origin/main
  } catch (error: any) {
    console.error('Failed to publish RabbitMQ event:', error.message);
  }
}

/**
 * TypeScript types for the Sustainability Coach feature.
 *
 * @module coach.types
 */

/**
 * Shape of a chat message in the coaching conversation.
 */
export interface Message {
  /** Unique identifier for the message. */
  readonly id: string;
  /** Role of the sender. */
  readonly role: 'user' | 'assistant';
  /** Text content of the message. */
  readonly content: string;
  /** ISO timestamp when the message was created. */
  readonly createdAt: string;
}

/**
 * Payload expected by the coach API endpoint.
 */
export interface CoachRequest {
  /** The new message sent by the user. */
  readonly message: string;
  /** The recent conversation history (max 10 items). */
  readonly conversationHistory: Message[];
}

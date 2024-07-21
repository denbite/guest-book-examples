import { NearBindgen, near, call, view, Vector } from 'near-sdk-js';
import { MessageSchema, POINT_ONE, PostedMessage } from './model';
import * as borsh from 'borsh';

@NearBindgen({
  serializer(value) {
    return borsh.serialize(schema, value);
  },
  deserializer(value) {
    return borsh.deserialize(schema, value);
  },
})
class GuestBook {
  messages: Vector<PostedMessage> = new Vector<PostedMessage>('v-uid');

  @call({ payableFunction: true })
  // Public - Adds a new message.
  add_message({ text }: { text: string }) {
    // If the user attaches more than 0.1N the message is premium
    const premium = near.attachedDeposit() >= BigInt(POINT_ONE);
    const sender = near.predecessorAccountId();

    const message: PostedMessage = { premium, sender, text };
    this.messages.push(message, {
      serializer: messageSerializer
    });
  }

  @view({})
  // Returns an array of messages.
  get_messages({ from_index = 0, limit = 10 }: { from_index: number, limit: number }): PostedMessage[] {
    return this.messages
      .toArray({
        deserializer: messageDeserializer
      })
      .slice(from_index, from_index + limit);
  }

  @view({})
  total_messages(): number { return this.messages.length }
}

function messageSerializer(value) {
  return borsh.serialize(MessageSchema, value);
}

function messageDeserializer(value) {
  return borsh.deserialize(MessageSchema, value);
} 

const schema: borsh.Schema = {
  struct: {
    // Vector's internal info
    messages: {
      struct: {
        prefix: 'string',
        length: 'u32',
      },
    },
  },
};

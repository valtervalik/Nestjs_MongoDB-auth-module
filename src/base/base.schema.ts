import { Prop, Schema } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class BaseSchema extends Document {
  @Prop({ type: Boolean, default: false })
  deleted: boolean;

  @Prop({ type: Date })
  deletedAt: Date;

  @Prop({ type: Date })
  restoredAt: Date;
}

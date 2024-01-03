import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, HydratedDocument, Types } from 'mongoose';
import { User } from 'src/users/schemas/user.schema';

export type ApiKeyDocument = HydratedDocument<ApiKey>;

@Schema()
export class ApiKey extends Document {
  @Prop({ type: String, required: true, unique: true })
  key: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  user: User;
}

export const ApiKeySchema = SchemaFactory.createForClass(ApiKey);

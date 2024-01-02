import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { BaseSchema } from 'src/base/base.schema';
import { User } from './user.schema';

export type PermissionDocument = HydratedDocument<Permission>;

@Schema({ timestamps: true })
export class Permission extends BaseSchema {
  @Prop({ type: Boolean, default: false })
  create_user: boolean;

  @Prop({ type: Boolean, default: false })
  update_user: boolean;

  @Prop({ type: Boolean, default: false })
  delete_user: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy: User;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy: User;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  deletedBy: User;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  restoredBy: User;
}
export const PermissionSchema = SchemaFactory.createForClass(Permission);
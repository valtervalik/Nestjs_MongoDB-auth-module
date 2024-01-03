import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { BaseSchema } from 'src/base/base.schema';
import { Permission } from 'src/users/schemas/permission.schema';
import { Role } from './role.schema';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User extends BaseSchema {
  @Prop({ type: String, required: true, unique: true })
  email: string;

  @Prop({ type: String, select: false })
  password?: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Role' })
  role: Role;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Permission' })
  permission: Permission;

  @Prop({ type: Boolean, default: false })
  isTFAEnabled: boolean;

  @Prop({ type: String })
  tfaSecret?: string;

  @Prop({ type: String })
  googleId?: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  createdBy: User;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  updatedBy: User;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  deletedBy: User;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  restoredBy: User;
}

export const UserSchema = SchemaFactory.createForClass(User);

import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/base/base.service';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService extends BaseService<UserDocument>(User.name) {}

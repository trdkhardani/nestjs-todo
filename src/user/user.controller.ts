import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { UserService } from './user.service';
import type { UserPayload } from 'src/interface/auth';

@Controller()
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  async info(@Req() req: UserPayload): Promise<object> {
    const userInfo = await this.userService.info(
      {
        user_id: req.user.userId,
      },
      {
        user_id: true,
        user_email: true,
        user_name: true,
        user_username: true,
        user_role: true,
      },
    );

    return {
      success: true,
      data: userInfo,
      message: 'User info retrieved successfully.',
    };
  }
}

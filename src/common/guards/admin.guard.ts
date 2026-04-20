import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { UserRole } from 'generated/prisma/enums';
import { Observable } from 'rxjs';
import { UserPayload } from 'src/modules/auth/interfaces/auth.interface';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request: UserPayload = context.switchToHttp().getRequest();

    if (request.user.role !== UserRole.ADMIN) {
      return false;
    }

    return true;
  }
}

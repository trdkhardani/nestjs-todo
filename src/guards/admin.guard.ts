import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { UserRole } from 'generated/prisma/enums';
import { Observable } from 'rxjs';
import { UserPayload } from 'src/interface/auth';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request: UserPayload = context.switchToHttp().getRequest();

    if (request.user.userRole !== UserRole.ADMIN) {
      return false;
    }

    return true;
  }
}

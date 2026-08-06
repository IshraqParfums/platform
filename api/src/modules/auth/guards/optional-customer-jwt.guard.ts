import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Attaches `request.user` when a valid customer JWT is present.
 * Missing or invalid tokens do not fail the request — identity stays unset.
 */
@Injectable()
export class OptionalCustomerJwtGuard extends AuthGuard('customer-jwt') {
  canActivate(context: ExecutionContext) {
    const result = super.canActivate(context);

    if (typeof result === 'boolean') {
      return true;
    }

    if (result instanceof Promise) {
      return result.then(() => true).catch(() => true);
    }

    return true;
  }

  handleRequest<TUser>(
    err: Error | null,
    user: TUser | false,
  ): TUser | undefined {
    if (err instanceof UnauthorizedException || !user) {
      return undefined;
    }
    if (err) {
      throw err;
    }
    return user;
  }
}

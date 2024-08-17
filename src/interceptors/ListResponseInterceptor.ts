import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { IBaseListResponse } from 'src/common/interface/IBaseListResponse';
import { map, Observable } from 'rxjs';

export class ListResponseInterceptor<T>
  implements NestInterceptor<[T[], number], IBaseListResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<IBaseListResponse<T>> {
    return next.handle().pipe(
      map((d) => {
        context.switchToHttp().getResponse().setHeader('X-Total-Length', d[1]);
        return {
          total: d[1],
          data: d[0],
        };
      }),
    );
  }
}

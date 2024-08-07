import { Interceptor, InterceptorInterface, Action } from 'routing-controllers';
import { CommonListResponse } from '../helpers/ResponseHelper';

export class ListResponseInterceptor implements InterceptorInterface {
  intercept(action: Action, content: any) {
    return CommonListResponse(content, action.response)
  }
}
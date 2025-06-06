import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const CurrentLanguage = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
	const request = ctx.switchToHttp().getRequest();
	return (request.query.lang || request.headers["lang"] || "ru") as string;
});

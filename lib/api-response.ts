import { NextResponse } from "next/server";

/**
 * 统一的 API 成功响应
 */
export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

/**
 * 统一的 API 错误响应
 */
export function errorResponse(
  message: string,
  status = 400,
  code?: string
) {
  return NextResponse.json(
    { success: false, error: message, code },
    { status }
  );
}

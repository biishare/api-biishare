import { Request, Response } from "express";
/**
 * GET /api/posts
 * Query params:
 * - subjectId
 * - level
 * - year
 * - contentType  ✅ (ADICIONADO)
 * - page (opcional)
 * - limit (opcional)
 */
export declare const getPosts: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=Get.d.ts.map
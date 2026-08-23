import { z } from "zod";

export const updateMemberRoleSchema = z.object({
  roleId: z.string().min(1),
});
export type UpdateMemberRoleDto = z.infer<typeof updateMemberRoleSchema>;

export const businessMemberStatusSchema = z.enum(["ACTIVE", "INVITED", "DISABLED"]);

export const updateMemberStatusSchema = z.object({
  status: businessMemberStatusSchema,
});
export type UpdateMemberStatusDto = z.infer<typeof updateMemberStatusSchema>;

export const businessMemberSchema = z.object({
  id: z.string(),
  userId: z.string(),
  fullName: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  roleId: z.string(),
  roleName: z.string(),
  status: businessMemberStatusSchema,
  joinedAt: z.string(),
});
export type BusinessMemberDto = z.infer<typeof businessMemberSchema>;

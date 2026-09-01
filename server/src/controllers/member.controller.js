/**
 * Member Controller — HTTP Request Handlers for Team Members
 */
import { MemberService } from '../services/member.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../utils/constants.js';

export class MemberController {
  static async getAllMembers(req, res) {
    const { status, department, search } = req.query;
    const members = await MemberService.getAllMembers({ status, department, search });
    return ApiResponse.success(res, {
      statusCode: HTTP_STATUS.OK,
      message: 'Workspace members retrieved successfully',
      data: members
    });
  }

  static async getMemberById(req, res) {
    const { memberId } = req.params;
    const member = await MemberService.getMemberById(memberId);
    return ApiResponse.success(res, {
      statusCode: HTTP_STATUS.OK,
      message: 'Member retrieved successfully',
      data: member
    });
  }

  static async createMember(req, res) {
    const member = await MemberService.createMember(req.body);
    return ApiResponse.success(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: 'Member created successfully',
      data: member
    });
  }

  static async updateMember(req, res) {
    const { memberId } = req.params;
    const member = await MemberService.updateMember(memberId, req.body);
    return ApiResponse.success(res, {
      statusCode: HTTP_STATUS.OK,
      message: 'Member updated successfully',
      data: member
    });
  }

  static async deleteMember(req, res) {
    const { memberId } = req.params;
    const result = await MemberService.deleteMember(memberId);
    return ApiResponse.success(res, {
      statusCode: HTTP_STATUS.OK,
      message: 'Member deleted successfully',
      data: result
    });
  }
}

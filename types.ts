
export enum RequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED'
}

export type PassType = 'GATE' | 'OUT';
export type TransitDirection = 'ENTRY' | 'EXIT';

export interface TransitLog {
  id: string;
  studentId: string;
  studentName: string;
  usn: string;
  passId: string;
  passType: PassType;
  hostel: string;
  direction: TransitDirection;
  timestamp: string;
  securityOfficer: string;
}

export interface Student {
  id: string;
  name: string;
  usn: string;
  branch: string;
  department: string;
  hostel: string;
  warden: string;
  phone: string;
  parentPhone: string;
  photo: string;
}

export interface GatePassRequest {
  id: string;
  passType: PassType;
  studentId: string;
  studentName: string;
  usn: string;
  branch: string;
  hostel: string;
  roomNo: string;
  phone: string;
  parentPhone: string;
  reason: string;
  outTime: string;
  expectedInTime: string;
  status: RequestStatus;
  timestamp: string;
  photo?: string;
  approvalId?: string;
  approvedBy?: string;
  wardenSignature?: string;
  expiryTime?: string;
  rejectionReason?: string;
}

export interface User {
  id: string;
  role: 'STUDENT' | 'WARDEN' | 'SECURITY' | 'ADMIN';
  name: string;
  hostelId?: string;
}

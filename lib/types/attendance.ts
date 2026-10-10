// Attendance Types and Interfaces

export interface AttendanceRecord {
  id: string;
  event_id: string;
  user_id: string;
  scanned_at: string;
  qr_code_id: string;
  created_at: string;
}

export interface QRCodeData {
  id: string;
  event_id: string;
  code: string;
  created_at: string;
  expires_at?: string;
}

export interface EventWithQR {
  id: string;
  name: string;
  description?: string;
  date: string;
  start_time: string;
  end_time: string;
  location?: string;
  qr_code?: QRCodeData;
  attendance_count?: number;
}

export interface AttendanceStats {
  total_attendees: number;
  event_id: string;
  event_name: string;
  attended_users: AttendanceRecord[];
}

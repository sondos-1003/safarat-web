export interface ApiResponse<T = any> {
  success: boolean;
  messageAr: string;
  messageEn: string;
  data: T;
  statusCode: number;
}

export interface FieldError {
  field: string;
  messageAr: string;
  messageEn: string;
}

export interface Paged<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface Lookup {
  id: number;
  nameAr: string;
  nameEn: string;
}

export interface UserRef {
  id: number;
  nameAr: string;
  nameEn: string;
}

export interface AuthUser {
  id: number;
  firstNameAr: string;
  lastNameAr: string;
  firstNameEn: string;
  lastNameEn: string;
  email: string;
  roleCode: string;
  roleNameAr: string;
  roleNameEn: string;
  permissions: string[];
}

export interface AuthResponse {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  mustChangePassword: boolean;
  user: AuthUser;
}

export interface ProgramState {
  code: string;
  nameAr: string;
  nameEn: string;
  isRegistrationOpen: boolean;
  acceptedCount: number;
  remainingSeats: number;
}

export interface ProgramListItem {
  id: number;
  nameAr: string;
  nameEn: string;
  seats: number;
  status: Lookup;
  state: ProgramState;
  sessionsCount: number;
  firstSessionStartsAt: string | null;
  registrationClosesAt: string | null;
  createdAt: string;
}

export interface ProgramDetails {
  id: number;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  seats: number;
  registrationClosesAt: string | null;
  type: Lookup;
  status: Lookup;
  state: ProgramState;
  sessionsCount: number;
  firstSessionStartsAt: string | null;
  lastSessionEndsAt: string | null;
  publishedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  createdBy: UserRef | null;
  updatedAt: string | null;
  updatedBy: UserRef | null;
}

export interface SessionDto {
  id: number;
  programId: number;
  topicAr: string;
  topicEn: string;
  startsAt: string;
  endsAt: string;
  meetingUrl: string;
  isCancelled: boolean;
  cancelledAt: string | null;
  trainers: UserRef[];
}

export interface TrainerConflict {
  sessionId: number;
  programId: number;
  programNameAr: string;
  programNameEn: string;
  topicAr: string;
  topicEn: string;
  startsAt: string;
  endsAt: string;
}

export interface WorkshopSession {
  id: number;
  topicAr: string;
  topicEn: string;
  startsAt: string;
  endsAt: string;
  meetingUrl: string;
  isCancelled: boolean;
  experts: UserRef[];
}

export interface WorkshopDetails {
  id: number;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  seats: number;
  registrationClosesAt: string | null;
  followUpDelayDays: number;
  type: Lookup;
  status: Lookup;
  state: ProgramState;
  acceptedCount: number;
  remainingSeats: number;
  session: WorkshopSession;
  publishedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  createdBy: UserRef | null;
  updatedAt: string | null;
  updatedBy: UserRef | null;
}

export interface BrowseItem {
  id: number;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  seats: number;
  remainingSeats: number;
  state: ProgramState;
  sessionsCount: number;
  firstSessionStartsAt: string | null;
  registrationClosesAt: string | null;
}

export interface MyEnrollment {
  id: number;
  programId: number;
  programNameAr: string;
  programNameEn: string;
  programType: Lookup;
  status: Lookup;
  firstSessionStartsAt: string | null;
  createdAt: string;
  decidedAt: string | null;
  reason: string | null;
}

export interface ProgramEnrollmentItem {
  id: number;
  userId: number;
  fullNameAr: string;
  fullNameEn: string;
  email: string;
  phoneNumber: string;
  cityNameAr: string;
  cityNameEn: string;
  status: Lookup;
  createdAt: string;
  decidedAt: string | null;
  reason: string | null;
}

export interface TraineeProgress {
  programId: number;
  programNameAr: string;
  totalSessions: number;
  attendedSessions: number;
  attendancePercent: number;
  isCompleted: boolean;
}

export interface MySession {
  id: number;
  program: Lookup;
  programType: Lookup;
  topicAr: string;
  topicEn: string;
  startsAt: string;
  endsAt: string;
  meetingUrl: string;
  isCancelled: boolean;
}

export interface AttendanceItem {
  enrollmentId: number;
  userId: number;
  fullNameAr: string;
  fullNameEn: string;
  isPresent: boolean | null;
  editReason: string | null;
}

export interface RatingItem {
  id: number;
  stars: number;
  note: string | null;
  createdAt: string;
  traineeName: string | null;
}

export interface RatingSummary {
  sessionId: number;
  averageRating: number;
  totalRatings: number;
  ratings: RatingItem[];
}

export interface MaterialItem {
  id: number;
  title: string;
  typeId: number;
  typeNameAr: string;
  url: string | null;
  originalFileName: string | null;
  sizeBytes: number | null;
  createdAt: string;
}

export interface SettingItem {
  id: number;
  key: string;
  nameAr: string;
  nameEn: string;
  value: string;
}

export interface UserListItem {
  id: number;
  firstNameAr: string;
  lastNameAr: string;
  firstNameEn: string;
  lastNameEn: string;
  email: string;
  phoneNumber: string;
  role: Lookup;
  city: Lookup;
  isActive: boolean;
  isLocked: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface UserDetails extends UserListItem {
  lockoutEndAt: string | null;
  isEmailConfirmed: boolean;
  mustChangePassword: boolean;
  createdBy: UserRef | null;
  updatedAt: string | null;
  updatedBy: UserRef | null;
}

export interface PermissionItem {
  id: number;
  code: string;
  nameAr: string;
  nameEn: string;
  hasPermission: boolean;
  source: string;
}

export interface PermissionModule {
  id: number;
  nameAr: string;
  nameEn: string;
  permissions: PermissionItem[];
}

export interface UserPermissions {
  userId: number;
  role: Lookup;
  isEditable: boolean;
  modules: PermissionModule[];
}

export interface EventDetails {
  id: number;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  city: Lookup;
  location: string;
  speakers: string | null;
  startsAt: string;
  endsAt: string;
  seats: number;
  bookedSeats: number;
  remainingSeats: number;
  status: Lookup;
  publishedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
}

export interface EventBrowseItem {
  id: number;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  cityNameAr: string;
  cityNameEn: string;
  location: string;
  speakers: string | null;
  startsAt: string;
  endsAt: string;
  remainingSeats: number;
  isFull: boolean;
}

export interface EventBookingConfirmation {
  bookingCode: string;
  eventTitleAr: string;
  fullName: string;
  totalSeatsBooked: number;
  startsAt: string;
  location: string;
}

export interface EventAttendee {
  bookingId: number;
  bookingCode: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  companionsCount: number;
  isAttended: boolean;
  attendedAt: string | null;
  isCancelled: boolean;
}

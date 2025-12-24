
import { Student } from './types';

export const MOCK_STUDENTS: Record<string, Student> = {
  'STU001': {
    id: 'STU001',
    name: 'Aryan Sharma',
    usn: '1MS21CS042',
    branch: 'Computer Science',
    department: 'Engineering',
    hostel: 'Krishna',
    warden: 'Dr. Ramesh Kumar',
    phone: '+91 98765 43210',
    parentPhone: '+91 91234 56789',
    photo: 'https://picsum.photos/seed/aryan/200'
  },
  'STU002': {
    id: 'STU002',
    name: 'Priya Das',
    usn: '1MS21IS088',
    branch: 'Information Science',
    department: 'Engineering',
    hostel: 'Nethravati',
    warden: 'Dr. Ramesh Kumar',
    phone: '+91 88888 77777',
    parentPhone: '+91 99999 88888',
    photo: 'https://picsum.photos/seed/priya/200'
  }
};

export const HOSTELS = [
  'Krishna',
  'Nethravati',
  'Sharavati',
  'Ghataprabha',
  'Thungabhadra',
  'SC/ST',
  'Malaprabha',
  'kaveri'
];

export const DURATIONS = [
  { label: '2 Hours', value: 2 },
  { label: '4 Hours', value: 4 },
  { label: 'Full Day', value: 12 },
  { label: 'Overnight', value: 24 }
];

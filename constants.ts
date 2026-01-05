
import { Match } from './types';

export const MOCK_MATCHES: Match[] = [
  {
    id: 'm1',
    sport: 'Cricket',
    teamA: 'India',
    teamB: 'Pakistan',
    captainPhotoA: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=200&h=200&fit=crop',
    captainPhotoB: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=200&h=200&fit=crop',
    oddsA: 1.85,
    oddsB: 1.95,
    startTime: '2024-06-09T14:30:00Z',
    league: 'T20 World Cup',
    status: 'live',
    score: '112/3 (14.1)',
    isHot: true
  },
  {
    id: 'm2',
    sport: 'Football',
    teamA: 'Real Madrid',
    teamB: 'Dortmund',
    captainPhotoA: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=200&h=200&fit=crop',
    captainPhotoB: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=200&h=200&fit=crop',
    oddsA: 1.65,
    oddsDraw: 4.2,
    oddsB: 5.0,
    startTime: '2024-06-01T19:00:00Z',
    league: 'Champions League',
    status: 'upcoming',
    isHot: true
  }
];

import { UserProfile, Scrap, Testimonial, Friend, Community, PhotoItem } from '../types';

export const initialProfile: UserProfile = {
  id: '',
  name: 'Membro Vibe',
  handle: 'membro',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  pronouns: '',
  age: 0,
  city: '',
  relationshipStatus: '',
  currentVibe: 'Sintonizando novas conexões ✨',
  bio: 'Bem-vindo ao meu perfil no Tribbu\'sVibe!',
  founderBadge: false,
  memberSince: '2026',
  vibeMeters: {
    trustworthy: 100,
    cool: 100,
    sexy: 100,
  },
  stats: {
    scraps: 0,
    photos: 0,
    videos: 0,
    testimonials: 0,
    fans: 0,
  },
};

export const FORTUNES = [
  '🥠 "Descanse a mente: nenhum algoritmo vale a sua paz de espírito."',
  '🥠 "A nostalgia não é sobre voltar no tempo, é sobre resgatar a calma."',
  '🥠 "Seja legal com quem te enviava scraps com carimbo de glitter."',
  '🥠 "Hoje seu café estará quente e seu crush visualizará em 3 minutos."',
  '🥠 "Um amigo de verdade nunca dá skip na sua música do perfil."',
  '🥠 "A vida é curta demais para se preocupar com likes invisíveis."',
  '🥠 "Deus me disse: desce pro play e arrasa."',
  '🥠 "A sua vibe é rara. Não deixe ninguém apagar seu brilho Y2K."',
  '🥠 "Sorte de hoje: 100% de chances de tomar um açaí ouvindo pop punk."',
];

export const initialScraps: Scrap[] = [];

export const initialTestimonials: Testimonial[] = [];

export const topFriends: Friend[] = [];

export const initialCommunities: Community[] = [];

export const initialPhotos: PhotoItem[] = [];

export const recentVisitors: { name: string; time: string; avatar: string }[] = [];

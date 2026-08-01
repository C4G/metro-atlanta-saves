import { signalStore, withState } from '@ngrx/signals';

type Members = {
  name: string;
  experience: string;
  img: string;
  roles: string[];
};

type MembersState = {
  members: Members[];
};

const initialState: MembersState = {
  members: [
    {
      name: 'Justin McLellan',
      experience: '10+ years working in the industry with a focus on front-end architecture using Angular and Nx.',
      img: 'assets/team/justin-mclellan.webp',
      roles: ['TA', 'Front-end Developer', 'Back-end Developer'],
    },
    {
      name: 'Yunus Zeytuncu',
      experience: '15+ years of experience in teaching and research in mathematics.',
      img: 'assets/team/yunus-zeytuncu.webp',
      roles: ['Team Lead', 'Front-end Developer'],
    },
    {
      name: 'Mohamed Abdulwahab',
      experience:
        '3 Years of Experience in Full-Stack Software Engineering and 2 years of Experience in Data Engineering.',
      img: 'assets/team/mohamed-abdulwahab.webp',
      roles: ['Front-end Developer', 'Back-end Developer'],
    },
    {
      name: 'Dan Tran',
      experience: '3 Year of experience in operations and 3 years in data analytics.',
      img: 'assets/team/dan-tran.webp',
      roles: ['Front-end Developer', 'Back-end Developer'],
    },
    {
      name: 'Snigdha Majeti',
      experience: '3 years of experience in Data Engineering and Machine Learning.',
      img: 'assets/team/snigdha-majeti.webp',
      roles: ['Front-end Developer', 'Back-end Developer'],
    },
    {
      name: 'Rithvik Bhogadi',
      experience: '3 years of experience in Sofware Development and Cloud Technologies',
      img: 'assets/team/rithvik-bhogadi.webp',
      roles: ['Front-end Developer'],
    },
  ],
};

export const MembersStore = signalStore(withState(initialState));

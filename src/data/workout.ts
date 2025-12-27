export type Exercise = {
  id: number;
  name: string;
  description: string[];
  image?: string;
  canMirror?: boolean;
};

export const WORKOUT: Exercise[] = [
  {
    id: 1,
    name: 'Simple Elbow Plank',
    description: [
      'Place your elbows under your shoulders',
      'Keep your body in a straight line from head to heels',
      'Engage your core and glutes',
      'Keep your neck relaxed and gaze down',
    ],
    image: '/exercises/elbow-plank.png',
  },
  {
    id: 2,
    name: 'Slow Mountain Climber',
    description: [
      'Start in a high plank with arms straight',
      'Bring one knee toward your chest in a controlled motion',
      'Alternate legs slowly, without rushing',
      'Avoid bouncing or lifting your hips',
    ],

    image: '/exercises/mountain-climber.png',
  },
  {
    id: 3,
    name: 'Plank to Dolphin',
    description: [
      'Begin in an elbow plank position',
      'Push your hips upward, forming an inverted V shape',
      'Slowly return to plank with control',
      'Keep your elbows planted throughout, focus on smooth, steady movement',
    ],

    image: '/exercises/plank-dolphin.png',
  },
  {
    id: 4,
    name: 'Single Leg Plank',
    description: [
      'Start in an elbow plank',
      'Lift one leg while keeping hips level',
      'Keep your core tight and body aligned',
      'Switch legs when prompted',
    ],
    image: '/exercises/single-leg-plank.png',
    canMirror: true,
  },
  {
    id: 5,
    name: 'Plank Hip Dip',
    description: [
      'Hold an elbow plank position',
      'Rotate your hips to one side, lowering toward the floor',
      'Return to center, then rotate to the other side',
      'Keep shoulders stable and controlled, move slowly to maintain balance',
    ],

    image: '/exercises/hip-dip.png',
  },
  {
    id: 6,
    name: 'Side Plank',
    description: [
      'Lie on your side with your forearm on the floor',
      'Stack your feet and lift your hips, keeping your body in a straight line',
      'Engage your core to stay balanced and avoid collapsing into the shoulder',
    ],

    image: '/exercises/side-plank.png',
    canMirror: true,
  },
  {
    id: 7,
    name: 'Spiderman Plank',
    description: [
      'Start in an elbow plank',
      'Bring one knee outward toward the same-side elbow',
      'Return to plank and alternate sides',
      'Keep your torso stable and avoid rocking side to side',
    ],

    image: '/exercises/spiderman-plank.png',
  },
  {
    id: 8,
    name: 'Single Arm Plank',
    description: [
      'Keep your body in a straight line from head to heels.',
      'Support your weight on one straight arm, shoulder stacked over wrist.',
      'Keep the free arm close to your body and engage your core to prevent hip rotation.',
      'Breathe steadily and avoid shifting side to side.',
    ],
    image: '/exercises/single-arm-plank.png',
    canMirror: true,
  },
  {
    id: 9,
    name: 'Commando Plank',
    description: [
      'Start in an elbow plank',
      'Push up to a high plank one arm at a time',
      'Lower back down to elbows with control',
      'Alternate the leading arm each time',
    ],
    image: '/exercises/commando-plank.png',
  },
  {
    id: 10,
    name: 'Plank Jacks',
    description: [
      'Hold an elbow plank position',
      'Jump your feet out wide then back together, keeping your upper body stable',
      'Land softly and stay controlled',
      'Maintain a steady breathing rhythm',
    ],

    image: '/exercises/plank-jacks.png',
  },
];

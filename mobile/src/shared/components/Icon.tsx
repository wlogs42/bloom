import Svg, { Circle, Path, Rect } from 'react-native-svg';

export type IconName =
  | 'leaf'
  | 'home'
  | 'tasks'
  | 'chart'
  | 'plus'
  | 'arrow'
  | 'play'
  | 'pause'
  | 'reset'
  | 'check'
  | 'close'
  | 'mail'
  | 'lock'
  | 'user'
  | 'eye'
  | 'eye-off'
  | 'logout'
  | 'edit'
  | 'trash'
  | 'sun';

export function Icon({
  name,
  size = 22,
  color = '#253D32',
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round">
      {name === 'leaf' && (
        <>
          <Path d="M19.5 4.5c-9-1-16 3-13 10 7 3 12-2 13-10Z" />
          <Path d="M4 21c1-6 5-10 11-12" />
        </>
      )}
      {name === 'home' && (
        <>
          <Path d="m3 10 9-7 9 7v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
          <Path d="M9 21v-8h6v8" />
        </>
      )}
      {name === 'tasks' && (
        <>
          <Rect x="4" y="3" width="16" height="18" rx="4" />
          <Path d="m8 9 1.5 1.5L12 8M14 9h2M8 15h8" />
        </>
      )}
      {name === 'chart' && (
        <>
          <Path d="M5 20v-6M12 20V4M19 20V9" />
          <Circle cx="5" cy="10" r=".7" fill={color} stroke="none" />
        </>
      )}
      {name === 'plus' && <Path d="M12 5v14M5 12h14" />}
      {name === 'arrow' && <Path d="M5 12h14m-5-5 5 5-5 5" />}
      {name === 'play' && <Path d="m9 5 11 7-11 7Z" fill={color} strokeWidth={1} />}
      {name === 'pause' && (
        <>
          <Rect x="6" y="5" width="4" height="14" rx="1" fill={color} stroke="none" />
          <Rect x="14" y="5" width="4" height="14" rx="1" fill={color} stroke="none" />
        </>
      )}
      {name === 'reset' && (
        <>
          <Path d="M4 10a8 8 0 1 1 1 8M4 4v6h6" />
        </>
      )}
      {name === 'check' && <Path d="m5 12 4 4L19 6" />}
      {name === 'close' && <Path d="m6 6 12 12M6 18 18 6" />}
      {name === 'mail' && (
        <>
          <Rect x="3" y="5" width="18" height="14" rx="3" />
          <Path d="m4 7 8 6 8-6" />
        </>
      )}
      {name === 'lock' && (
        <>
          <Rect x="5" y="10" width="14" height="11" rx="3" />
          <Path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" />
        </>
      )}
      {name === 'user' && (
        <>
          <Circle cx="12" cy="8" r="4" />
          <Path d="M4 21v-2a8 8 0 0 1 16 0v2" />
        </>
      )}
      {(name === 'eye' || name === 'eye-off') && (
        <>
          <Path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
          <Circle cx="12" cy="12" r="3" />
          {name === 'eye-off' && <Path d="m3 3 18 18" />}
        </>
      )}
      {name === 'logout' && (
        <>
          <Path d="M9 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4M10 12h11m-4-4 4 4-4 4" />
        </>
      )}
      {name === 'edit' && (
        <>
          <Path d="m15 4 5 5M4 20l5-1L21 7a2 2 0 0 0-4-4L5 15Z" />
        </>
      )}
      {name === 'trash' && (
        <>
          <Path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7" />
        </>
      )}
      {name === 'sun' && (
        <>
          <Circle cx="12" cy="12" r="4" />
          <Path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" />
        </>
      )}
    </Svg>
  );
}

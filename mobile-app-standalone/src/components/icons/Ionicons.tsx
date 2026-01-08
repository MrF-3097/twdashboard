// Ionicons wrapper using react-icons for web compatibility
import React from 'react';
import * as Icons from 'react-icons/io5';

export type IconName = 
  | 'home' 
  | 'notifications' 
  | 'trending-up' 
  | 'person' 
  | 'construct' 
  | 'folder-open' 
  | 'clipboard' 
  | 'person-add' 
  | 'add' 
  | 'close'
  | 'stats-chart'
  | 'wallet'
  | 'home-outline'
  | 'document-text'
  | 'calendar'
  | 'trending-up-outline'
  | 'person-outline'
  | 'settings-outline';

interface IoniconsProps {
  name: IconName;
  size?: number;
  color?: string;
  style?: any;
}

const iconMap: Record<IconName, React.ComponentType<any>> = {
  'home': Icons.IoHome,
  'notifications': Icons.IoNotifications,
  'trending-up': Icons.IoTrendingUp,
  'person': Icons.IoPerson,
  'construct': Icons.IoConstruct,
  'folder-open': Icons.IoFolderOpen,
  'clipboard': Icons.IoClipboard,
  'person-add': Icons.IoPersonAdd,
  'add': Icons.IoAdd,
  'close': Icons.IoClose,
  'stats-chart': Icons.IoStatsChart,
  'wallet': Icons.IoWallet,
  'home-outline': Icons.IoHomeOutline,
  'document-text': Icons.IoDocumentText,
  'calendar': Icons.IoCalendar,
  'trending-up-outline': Icons.IoTrendingUpOutline,
  'person-outline': Icons.IoPersonOutline,
  'settings-outline': Icons.IoSettingsOutline,
};

export const Ionicons: React.FC<IoniconsProps> = ({ name, size = 24, color = '#000', style }) => {
  const IconComponent = iconMap[name] || Icons.IoEllipse;
  
  return <IconComponent size={size} color={color} style={style} />;
};

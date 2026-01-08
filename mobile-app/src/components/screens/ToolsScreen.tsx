/**
 * ToolsScreen Component
 * Matching Figma Design - Mobile CRM Design
 * Based on Mobile crm design from figma make
 * Translated to Romanian
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/lib/colors';
import { useRouter } from 'expo-router';
import { DocumentConverterModal } from '@/components/modules/tools/DocumentConverterModal';
import { PrinterDriverModal } from '@/components/modules/tools/PrinterDriverModal';
import { RealEstateGeneratorModal } from '@/components/modules/tools/RealEstateGeneratorModal';
import { ImageEditorModal } from '@/components/modules/tools/ImageEditorModal';
import { PhotoFixerModal } from '@/components/modules/tools/PhotoFixerModal';

interface Tool {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
  gradient: string[];
}

const tools: Tool[] = [
  {
    id: 'documents',
    name: 'Convertor Documente',
    icon: 'document-text-outline',
    description: 'DOCX ↔ PDF',
    gradient: ['#5B8DEF', '#3B82F6'],
  },
  {
    id: 'real-estate',
    name: 'Anunțuri Imobiliare',
    icon: 'business-outline',
    description: 'Generează anunțuri cu AI',
    gradient: ['#10B981', '#059669'],
  },
  {
    id: 'printer',
    name: 'Driver Imprimantă',
    icon: 'print-outline',
    description: 'Descarcă driver-uri',
    gradient: ['#F59E0B', '#D97706'],
  },
  {
    id: 'image-editor',
    name: 'Editor Imagini',
    icon: 'image-outline',
    description: 'Editează imagini',
    gradient: ['#8B5CF6', '#7C3AED'],
  },
  {
    id: 'photo-fixer',
    name: 'Expansiune Imagini',
    icon: 'sparkles-outline',
    description: 'Extinde imagini cu AI',
    gradient: ['#EC4899', '#DB2777'],
  },
  {
    id: 'agent-ranking',
    name: 'Agent Ranking',
    icon: 'trending-up-outline',
    description: 'Vezi clasamentul',
    gradient: ['#FBBF24', '#F59E0B'],
  },
];

export const ToolsScreen: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  
  const [documentConverterOpen, setDocumentConverterOpen] = useState(false);
  const [printerDriverOpen, setPrinterDriverOpen] = useState(false);
  const [realEstateGeneratorOpen, setRealEstateGeneratorOpen] = useState(false);
  const [imageEditorOpen, setImageEditorOpen] = useState(false);
  const [photoFixerOpen, setPhotoFixerOpen] = useState(false);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleToolPress = (tool: Tool) => {
    switch (tool.id) {
      case 'documents':
        setDocumentConverterOpen(true);
        break;
      case 'printer':
        setPrinterDriverOpen(true);
        break;
      case 'agent-ranking':
        router.push('/(tabs)/leaderboard');
        break;
      case 'real-estate':
        setRealEstateGeneratorOpen(true);
        break;
      case 'image-editor':
        setImageEditorOpen(true);
        break;
      case 'photo-fixer':
        setPhotoFixerOpen(true);
        break;
      default:
        break;
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top, 20) }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <View style={styles.headerRow}>
          <View style={styles.headerIconContainer}>
            <Ionicons name="construct" size={24} color={colors.primary} />
          </View>
          <View>
            <Text style={styles.title}>Unelte</Text>
            <Text style={styles.subtitle}>{tools.length} instrumente disponibile</Text>
          </View>
        </View>
      </Animated.View>

      {/* Tools Grid */}
      <Animated.View style={[styles.toolsGrid, { opacity: fadeAnim }]}>
        {tools.map((tool) => (
          <TouchableOpacity
            key={tool.id}
            style={styles.toolCard}
            onPress={() => handleToolPress(tool)}
            activeOpacity={0.7}
          >
            <View style={styles.toolCardContent}>
              <View style={styles.toolIconContainer}>
                <View style={[styles.toolIconGradient, { backgroundColor: tool.gradient[0] + '20' }]}>
                  <Ionicons name={tool.icon} size={28} color={tool.gradient[0]} />
                </View>
              </View>
              <Text style={styles.toolName}>{tool.name}</Text>
              <Text style={styles.toolDescription}>{tool.description}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </Animated.View>

      {/* Modals */}
      <DocumentConverterModal
        isOpen={documentConverterOpen}
        onClose={() => setDocumentConverterOpen(false)}
      />
      <PrinterDriverModal
        isOpen={printerDriverOpen}
        onClose={() => setPrinterDriverOpen(false)}
      />
      <RealEstateGeneratorModal
        isOpen={realEstateGeneratorOpen}
        onClose={() => setRealEstateGeneratorOpen(false)}
      />
      <ImageEditorModal
        isOpen={imageEditorOpen}
        onClose={() => setImageEditorOpen(false)}
      />
      <PhotoFixerModal
        isOpen={photoFixerOpen}
        onClose={() => setPhotoFixerOpen(false)}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 96, // Space for bottom nav
  },
  header: {
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 14,
    color: colors.text.muted,
    marginTop: 2,
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  toolCard: {
    width: '47%', // 2 columns with gap
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  toolCardContent: {
    padding: 20,
    alignItems: 'center',
    gap: 12,
  },
  toolIconContainer: {
    marginBottom: 4,
  },
  toolIconGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
  },
  toolDescription: {
    fontSize: 12,
    color: colors.text.muted,
    textAlign: 'center',
  },
});


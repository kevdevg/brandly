import { TimelineElement, TimelineLayer } from '../../types';

export interface SceneTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'titulo' | 'contenido' | 'cierre' | 'transicion';
  /** Elements to create (positions in %, frames relative to insertion point) */
  elements: Omit<TimelineElement, 'id' | 'layerId' | 'startFrame' | 'endFrame' | 'isBrandElement' | 'isLocked'>[];
  /** Duration in frames at 30fps */
  durationFrames: number;
}

export const SCENE_TEMPLATES: SceneTemplate[] = [
  // ═══ Titles ═══
  {
    id: 'title-centered',
    name: 'Título Central',
    description: 'Texto grande centrado con entrada animada',
    icon: '🎬',
    category: 'titulo',
    durationFrames: 90,
    elements: [
      {
        type: 'text',
        content: 'Tu Título Aquí',
        x: 50,
        y: 45,
        scale: 2,
        rotation: 0,
        opacity: 100,
        fontSize: 48,
        fontWeight: '800',
        color: '#FFFFFF',
        textAlign: 'center',
        transitionIn: { type: 'scale', duration: 15 },
        transitionOut: { type: 'fade', duration: 15 },
      },
      {
        type: 'text',
        content: 'Subtítulo descriptivo',
        x: 50,
        y: 58,
        scale: 1,
        rotation: 0,
        opacity: 80,
        fontSize: 18,
        fontWeight: '400',
        color: '#CCCCCC',
        textAlign: 'center',
        transitionIn: { type: 'fade', duration: 20 },
        transitionOut: { type: 'fade', duration: 10 },
      },
    ],
  },
  {
    id: 'title-lower-third',
    name: 'Lower Third',
    description: 'Barra de título inferior profesional',
    icon: '📺',
    category: 'titulo',
    durationFrames: 120,
    elements: [
      {
        type: 'text',
        content: 'Nombre del Presentador',
        x: 25,
        y: 82,
        scale: 1.2,
        rotation: 0,
        opacity: 100,
        fontSize: 24,
        fontWeight: '700',
        color: '#FFFFFF',
        textAlign: 'left',
        transitionIn: { type: 'slideRight', duration: 15 },
        transitionOut: { type: 'slideRight', duration: 15 },
      },
      {
        type: 'text',
        content: 'Cargo o Descripción',
        x: 25,
        y: 89,
        scale: 1,
        rotation: 0,
        opacity: 70,
        fontSize: 14,
        fontWeight: '400',
        color: '#AAAAAA',
        textAlign: 'left',
        transitionIn: { type: 'slideRight', duration: 20 },
        transitionOut: { type: 'fade', duration: 10 },
      },
    ],
  },
  // ═══ Content ═══
  {
    id: 'content-list',
    name: 'Lista de Puntos',
    description: 'Tres puntos con aparición escalonada',
    icon: '📋',
    category: 'contenido',
    durationFrames: 150,
    elements: [
      {
        type: 'text',
        content: '1. Primer punto importante',
        x: 50,
        y: 30,
        scale: 1,
        rotation: 0,
        opacity: 100,
        fontSize: 22,
        fontWeight: '600',
        color: '#FFFFFF',
        textAlign: 'center',
        transitionIn: { type: 'slideUp', duration: 12 },
      },
      {
        type: 'text',
        content: '2. Segundo punto clave',
        x: 50,
        y: 45,
        scale: 1,
        rotation: 0,
        opacity: 100,
        fontSize: 22,
        fontWeight: '600',
        color: '#FFFFFF',
        textAlign: 'center',
        transitionIn: { type: 'slideUp', duration: 12 },
      },
      {
        type: 'text',
        content: '3. Tercer punto de cierre',
        x: 50,
        y: 60,
        scale: 1,
        rotation: 0,
        opacity: 100,
        fontSize: 22,
        fontWeight: '600',
        color: '#FFFFFF',
        textAlign: 'center',
        transitionIn: { type: 'slideUp', duration: 12 },
      },
    ],
  },
  // ═══ Closings ═══
  {
    id: 'closing-cta',
    name: 'Call to Action',
    description: 'Pantalla de cierre con CTA y redes',
    icon: '🔔',
    category: 'cierre',
    durationFrames: 120,
    elements: [
      {
        type: 'text',
        content: '¡Síguenos!',
        x: 50,
        y: 35,
        scale: 2,
        rotation: 0,
        opacity: 100,
        fontSize: 36,
        fontWeight: '800',
        color: '#FFFFFF',
        textAlign: 'center',
        transitionIn: { type: 'bounce', duration: 20 },
      },
      {
        type: 'text',
        content: '@tuusuario',
        x: 50,
        y: 55,
        scale: 1.2,
        rotation: 0,
        opacity: 90,
        fontSize: 24,
        fontWeight: '600',
        color: '#A78BFA',
        textAlign: 'center',
        transitionIn: { type: 'fade', duration: 15 },
      },
      {
        type: 'text',
        content: 'Suscríbete · Like · Comparte',
        x: 50,
        y: 70,
        scale: 1,
        rotation: 0,
        opacity: 60,
        fontSize: 14,
        fontWeight: '400',
        color: '#999999',
        textAlign: 'center',
        transitionIn: { type: 'fade', duration: 20 },
      },
    ],
  },
  // ═══ Transitions ═══
  {
    id: 'transition-stinger',
    name: 'Stinger',
    description: 'Texto rápido de transición',
    icon: '⚡',
    category: 'transicion',
    durationFrames: 45,
    elements: [
      {
        type: 'text',
        content: '→',
        x: 50,
        y: 50,
        scale: 4,
        rotation: 0,
        opacity: 100,
        fontSize: 64,
        fontWeight: '900',
        color: '#FFFFFF',
        textAlign: 'center',
        transitionIn: { type: 'scale', duration: 10 },
        transitionOut: { type: 'scale', duration: 10 },
      },
    ],
  },
];

/**
 * Insert a scene template at the given frame position.
 * Creates new elements on the specified layer.
 */
export function insertSceneTemplate(
  template: SceneTemplate,
  layerId: string,
  startFrame: number,
): TimelineElement[] {
  const stagger = 10; // stagger element starts for visual effect
  return template.elements.map((elTemplate, idx) => ({
    ...elTemplate,
    id: `tpl-${template.id}-${Date.now()}-${idx}`,
    layerId,
    startFrame: startFrame + (idx * stagger),
    endFrame: startFrame + template.durationFrames,
    isBrandElement: false,
    isLocked: false,
  }));
}

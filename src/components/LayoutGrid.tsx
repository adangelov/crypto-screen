import { useCallback, type ReactNode } from 'react';
import { Responsive, WidthProvider, type Layouts, type Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

export interface GridItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}

interface LayoutGridProps {
  layouts: Layouts;
  children: ReactNode;
  onLayoutChange: (currentLayout: Layout[], allLayouts: Layouts) => void;
}

const breakpoints = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
const cols = { lg: 12, md: 10, sm: 8, xs: 4, xxs: 2 };

const LayoutGrid = ({ layouts, children, onLayoutChange }: LayoutGridProps) => {
  const handleLayoutChange = useCallback(
    (currentLayout: Layout[], allLayouts: Layouts) => {
      onLayoutChange(currentLayout, allLayouts);
    },
    [onLayoutChange]
  );

  return (
    <ResponsiveGridLayout
      className="layout"
      layouts={layouts}
      breakpoints={breakpoints}
      cols={cols}
      rowHeight={40}
      margin={[16, 16]}
      containerPadding={[0, 16]}
      draggableHandle=".grid-drag-handle"
      isBounded
      compactType="vertical"
      onLayoutChange={handleLayoutChange}
    >
      {children}
    </ResponsiveGridLayout>
  );
};

export default LayoutGrid;

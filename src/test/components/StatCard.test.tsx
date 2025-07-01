
import { render, screen } from '../utils/test-utils';
import StatCard from '@/components/shared/StatCard';
import { FileText } from 'lucide-react';

describe('StatCard', () => {
  const defaultProps = {
    title: 'Test Metric',
    value: '100',
  };

  it('renders basic stat card correctly', () => {
    render(<StatCard {...defaultProps} />);
    
    expect(screen.getByText('Test Metric')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('displays loading skeleton when loading is true', () => {
    render(<StatCard {...defaultProps} loading={true} />);
    
    expect(screen.getByRole('status', { name: /loading statistics/i })).toBeInTheDocument();
    expect(screen.queryByText('Test Metric')).not.toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    render(<StatCard {...defaultProps} icon={FileText} />);
    
    const iconElement = screen.getByRole('img', { name: /test metric: 100/i });
    expect(iconElement).toBeInTheDocument();
  });

  it('displays change indicator with correct styling', () => {
    render(
      <StatCard 
        {...defaultProps} 
        change="+15%" 
        changeType="positive" 
      />
    );
    
    const changeElement = screen.getByRole('img', { name: /increase of \+15%/i });
    expect(changeElement).toBeInTheDocument();
    expect(changeElement).toHaveClass('text-success');
  });

  it('handles keyboard navigation', () => {
    render(<StatCard {...defaultProps} />);
    
    const cardElement = screen.getByRole('img', { name: /test metric: 100/i });
    expect(cardElement).toHaveAttribute('tabIndex', '0');
    expect(cardElement).toHaveClass('focus-visible');
  });

  it('renders description when provided', () => {
    render(
      <StatCard 
        {...defaultProps} 
        description="Additional context" 
      />
    );
    
    expect(screen.getByText('Additional context')).toBeInTheDocument();
  });
});

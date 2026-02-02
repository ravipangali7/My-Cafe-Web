import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Phone, Building2 } from 'lucide-react';

interface VendorInfoCellProps {
  name: string;
  phone?: string;
  logoUrl?: string | null;
  subtitle?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showPhone?: boolean;
  onClick?: () => void;
}

const sizeStyles = {
  sm: {
    avatar: 'h-8 w-8',
    name: 'text-sm',
    phone: 'text-xs',
  },
  md: {
    avatar: 'h-10 w-10',
    name: 'text-sm font-medium',
    phone: 'text-xs',
  },
  lg: {
    avatar: 'h-12 w-12',
    name: 'text-base font-medium',
    phone: 'text-sm',
  },
};

export function VendorInfoCell({
  name,
  phone,
  logoUrl,
  subtitle,
  className,
  size = 'md',
  showPhone = true,
  onClick,
}: VendorInfoCellProps) {
  const styles = sizeStyles[size];
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div
      className={cn(
        'flex items-center gap-3',
        onClick && 'cursor-pointer hover:bg-accent/50 rounded-lg p-1 -m-1 transition-colors',
        className
      )}
      onClick={onClick}
    >
      <Avatar className={cn(styles.avatar, 'flex-shrink-0')}>
        <AvatarImage src={logoUrl || undefined} alt={name} />
        <AvatarFallback className="bg-accent text-foreground font-medium">
          {getInitials(name)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className={cn('truncate text-foreground', styles.name)}>
          {name}
        </p>
        {showPhone && phone && (
          <p className={cn('text-muted-foreground truncate', styles.phone)}>
            {phone}
          </p>
        )}
        {subtitle && !phone && (
          <p className={cn('text-muted-foreground truncate', styles.phone)}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

// Customer info cell variant
export function CustomerInfoCell({
  name,
  phone,
  tableNo,
  className,
  onClick,
}: {
  name: string;
  phone: string;
  tableNo?: string;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      className={cn(
        'space-y-0.5',
        onClick && 'cursor-pointer hover:bg-accent/50 rounded-lg p-1 -m-1 transition-colors',
        className
      )}
      onClick={onClick}
    >
      <p className="text-sm font-medium text-foreground">{name}</p>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Phone className="h-3 w-3" />
        <span>{phone}</span>
        {tableNo && (
          <>
            <span className="text-border">•</span>
            <span>Table {tableNo}</span>
          </>
        )}
      </div>
    </div>
  );
}

// Compact vendor badge for inline use
export function VendorBadge({
  name,
  logoUrl,
  className,
  onClick,
}: {
  name: string;
  logoUrl?: string | null;
  className?: string;
  onClick?: () => void;
}) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-accent/50 text-sm',
        onClick && 'cursor-pointer hover:bg-accent transition-colors',
        className
      )}
      onClick={onClick}
    >
      <Avatar className="h-5 w-5">
        <AvatarImage src={logoUrl || undefined} alt={name} />
        <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
          {getInitials(name)}
        </AvatarFallback>
      </Avatar>
      <span className="font-medium truncate max-w-[100px]">{name}</span>
    </div>
  );
}

// Shareholder info cell with percentage
export function ShareholderInfoCell({
  name,
  phone,
  logoUrl,
  percentage,
  balance,
  className,
  onClick,
}: {
  name: string;
  phone?: string;
  logoUrl?: string | null;
  percentage?: number;
  balance?: number;
  className?: string;
  onClick?: () => void;
}) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div
      className={cn(
        'flex items-center gap-3',
        onClick && 'cursor-pointer hover:bg-accent/50 rounded-lg p-1 -m-1 transition-colors',
        className
      )}
      onClick={onClick}
    >
      <Avatar className="h-10 w-10 flex-shrink-0">
        <AvatarImage src={logoUrl || undefined} alt={name} />
        <AvatarFallback className="bg-accent text-foreground font-medium">
          {getInitials(name)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground truncate">{name}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {phone && <span>{phone}</span>}
          {percentage !== undefined && (
            <>
              {phone && <span className="text-border">•</span>}
              <span className="font-medium text-primary">{percentage}%</span>
            </>
          )}
        </div>
      </div>
      {balance !== undefined && (
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-semibold text-foreground">
            ₹{balance.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-muted-foreground">Balance</p>
        </div>
      )}
    </div>
  );
}

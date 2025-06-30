# LaunchClick Component Color Guidelines

## Button Implementation

### Primary Buttons (CTAs)
```css
/* Gradient background using brand colors */
background: linear-gradient(135deg, #8F36FF, #2D7FFF);
color: #FFFFFF;

/* Hover state */
:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(34, 109, 255, 0.3);
}

/* Active state */
:active {
  transform: translateY(0);
  box-shadow: 0 2px 6px rgba(34, 109, 255, 0.2);
}
```

### Secondary Buttons
```css
/* Light theme */
background: #A259FF;
color: #FFFFFF;
border: 1px solid #A259FF;

/* Dark theme */
background: #B66DFF;
color: #FFFFFF;
border: 1px solid #B66DFF;
```

### Outline Buttons
```css
/* Light theme */
background: transparent;
color: #226DFF;
border: 1px solid #226DFF;

/* Dark theme */
background: transparent;
color: #366DFF;
border: 1px solid #366DFF;
```

## Form Elements

### Input Fields
```css
/* Light theme */
background: #FFFFFF;
border: 1px solid #E5E7EB;
color: #111827;

:focus {
  border-color: #226DFF;
  box-shadow: 0 0 0 3px rgba(34, 109, 255, 0.1);
}

/* Dark theme */
background: #1A1E24;
border: 1px solid #374151;
color: #F3F4F6;

:focus {
  border-color: #366DFF;
  box-shadow: 0 0 0 3px rgba(54, 109, 255, 0.1);
}
```

### Placeholder Text
```css
/* Light theme */
::placeholder {
  color: #6B7280;
}

/* Dark theme */
::placeholder {
  color: #9CA3AF;
}
```

## Navigation Elements

### Navigation Links
```css
/* Default state */
color: #374151; /* Light theme */
color: #E5E7EB; /* Dark theme */

/* Hover state */
:hover {
  color: #226DFF; /* Light theme */
  color: #366DFF; /* Dark theme */
}

/* Active state */
.active {
  color: #226DFF; /* Light theme */
  color: #366DFF; /* Dark theme */
  font-weight: 600;
}
```

### Sidebar Items
```css
/* Default state */
background: transparent;
color: #374151; /* Light theme */
color: #E5E7EB; /* Dark theme */

/* Hover state */
:hover {
  background: #F8FAFC; /* Light theme */
  background: #1F252D; /* Dark theme */
  color: #226DFF; /* Light theme */
  color: #366DFF; /* Dark theme */
}

/* Active state */
.active {
  background: #F1F5F9; /* Light theme */
  background: #1F252D; /* Dark theme */
  color: #226DFF; /* Light theme */
  color: #366DFF; /* Dark theme */
  border-right: 2px solid #226DFF; /* Light theme */
  border-right: 2px solid #366DFF; /* Dark theme */
}
```

## Icons and Decorative Elements

### Brand Icons
```css
/* Primary brand color */
.icon-primary {
  color: #226DFF; /* Light theme */
  color: #366DFF; /* Dark theme */
}

/* Secondary brand color */
.icon-secondary {
  color: #A259FF; /* Light theme */
  color: #B66DFF; /* Dark theme */
}

/* Gradient icons */
.icon-gradient {
  background: linear-gradient(135deg, #8F36FF, #2D7FFF);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

### Status Icons
```css
.icon-success { color: #00E887; }
.icon-warning { color: #FFD600; }
.icon-error { color: #FF4747; }
.icon-info { 
  color: #226DFF; /* Light theme */
  color: #366DFF; /* Dark theme */
}
```

## Cards and Surfaces

### Card Backgrounds
```css
/* Light theme */
background: #FFFFFF;
border: 1px solid #E5E7EB;
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

/* Dark theme */
background: #1A1E24;
border: 1px solid #374151;
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
```

### Elevated Surfaces
```css
/* Light theme */
background: #F8FAFC;
border: 1px solid #E5E7EB;

/* Dark theme */
background: #1F252D;
border: 1px solid #374151;
```

## Dividers and Borders

### Standard Dividers
```css
/* Light theme */
border-color: #E5E7EB;

/* Dark theme */
border-color: #374151;
```

### Strong Dividers
```css
/* Light theme */
border-color: #D1D5DB;

/* Dark theme */
border-color: #4B5563;
```

## Status and Feedback Colors

### Success States
```css
/* Text */
color: #00E887;

/* Background */
background: rgba(0, 232, 135, 0.1);
border: 1px solid rgba(0, 232, 135, 0.2);
```

### Warning States
```css
/* Text */
color: #FFD600;

/* Background */
background: rgba(255, 214, 0, 0.1);
border: 1px solid rgba(255, 214, 0, 0.2);
```

### Error States
```css
/* Text */
color: #FF4747;

/* Background */
background: rgba(255, 71, 71, 0.1);
border: 1px solid rgba(255, 71, 71, 0.2);
```

## Focus and Selection States

### Focus Indicators
```css
:focus-visible {
  outline: 2px solid #226DFF; /* Light theme */
  outline: 2px solid #366DFF; /* Dark theme */
  outline-offset: 2px;
}
```

### Text Selection
```css
::selection {
  background: rgba(34, 109, 255, 0.3); /* Light theme */
  background: rgba(54, 109, 255, 0.3); /* Dark theme */
  color: inherit;
}
```

## Usage Rules

1. **Always use the rocket gradient for primary CTAs and brand elements**
2. **Maintain consistent hover states with subtle transforms and shadows**
3. **Use the adjusted color values for dark theme to ensure proper contrast**
4. **Apply status colors consistently across all components**
5. **Ensure focus indicators are always visible and meet 3:1 contrast ratio**
6. **Use elevation through background color changes rather than just shadows**
7. **Maintain the brand's energetic feel while ensuring accessibility**
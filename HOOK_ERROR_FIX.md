# Hook Error Fix: "Rendered more hooks than during the previous render"

## 🐛 Problem Description
The error "Rendered more hooks than during the previous render" occurs when React hooks are called inconsistently between renders. This typically happens when:
1. Hooks are called conditionally
2. Hooks are called inside loops or nested functions
3. New hooks are created on each render (like `useSharedValue` in render functions)

## 🔍 Root Cause Analysis
In the AdvancedFiltering component, the issue was caused by:

### 1. Inline Hook Creation
```tsx
// ❌ PROBLEMATIC CODE
thumbScaleValue={useSharedValue(1)}  // New hook on every render
```

### 2. Hook in Render Function
```tsx
// ❌ PROBLEMATIC CODE
renderThumb={() => (
  <View>
    // This creates a new component instance on every render
  </View>
)}
```

## ✅ Solution Implementation

### 1. Moved All Shared Values to Component Top Level
```tsx
// ✅ FIXED CODE
const AdvancedFilteringScreen = ({ navigation }) => {
  // All shared values declared at top level
  const sliderProgress = useSharedValue(1000);
  const sliderMin = useSharedValue(0);
  const sliderMax = useSharedValue(10000);
  const thumbScale = useSharedValue(1);  // ← Moved here
  
  // ... rest of component
```

### 2. Created External CustomThumb Component
```tsx
// ✅ FIXED CODE - Outside main component
const CustomThumb = () => (
  <View style={{
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  }}>
    <LinearGradient
      colors={['#ff6b35', '#ff8f65', '#de822c']}
      style={{
        width: 24,
        height: 24,
        borderRadius: 12,
      }}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    />
  </View>
);
```

### 3. Updated Slider to Use Static References
```tsx
// ✅ FIXED CODE
<Slider
  thumbScaleValue={thumbScale}     // ← Uses pre-defined shared value
  renderThumb={CustomThumb}        // ← Static component reference
  // ... other props
/>
```

## 🧠 Understanding React Hooks Rules

### The Rules of Hooks
1. **Only call hooks at the top level** - Never inside loops, conditions, or nested functions
2. **Only call hooks from React functions** - Components or custom hooks
3. **Same hooks in same order** - React relies on call order to track hook state

### Why This Matters
React uses the order of hook calls to maintain state between renders:
```tsx
// React internally tracks hooks like this:
// Render 1: [useState, useEffect, useSharedValue, useSharedValue]
// Render 2: [useState, useEffect, useSharedValue, useSharedValue] ✅ Same order
// Render 3: [useState, useEffect, useSharedValue, useSharedValue, useSharedValue] ❌ Extra hook!
```

## 🎯 Prevention Strategies

### 1. Always Declare Hooks at Top Level
```tsx
// ✅ GOOD
const MyComponent = () => {
  const [state, setState] = useState();
  const sharedValue = useSharedValue(0);
  
  return <View>...</View>;
};
```

### 2. Never Conditional Hooks
```tsx
// ❌ BAD
const MyComponent = ({ condition }) => {
  if (condition) {
    const [state, setState] = useState(); // ❌ Conditional hook
  }
};

// ✅ GOOD
const MyComponent = ({ condition }) => {
  const [state, setState] = useState(); // ✅ Always called
  
  if (condition) {
    // Use the state conditionally instead
  }
};
```

### 3. Extract Render Functions
```tsx
// ❌ BAD
<Slider
  renderThumb={() => <CustomComponent />} // ❌ New component each render
/>

// ✅ GOOD
const CustomThumb = () => <CustomComponent />;

<Slider
  renderThumb={CustomThumb} // ✅ Static reference
/>
```

## 🔧 Testing the Fix

### Before Fix
```
Error: Rendered more hooks than during the previous render.
```

### After Fix
```
✅ No hook errors
✅ Consistent hook count across renders
✅ Proper state management
✅ Smooth slider animations
```

## 📚 Key Takeaways

1. **Hook Consistency**: Always call the same hooks in the same order
2. **Top-Level Only**: Declare all hooks at the component's top level
3. **Static References**: Avoid creating new functions/components in render
4. **Shared Values**: Manage react-native-reanimated shared values carefully

## 🎉 Result
The AdvancedFiltering component now:
- ✅ Follows React hooks rules correctly
- ✅ Has consistent hook calls across renders
- ✅ Uses optimized render functions
- ✅ Maintains all slider functionality
- ✅ No more hook-related errors

This fix ensures stable, predictable behavior and eliminates the hook rendering error while maintaining all the advanced slider functionality.

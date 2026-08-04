// WinLand Data-Driven Device Catalog & Data Model
export const DEVICE_COLOR_VARIANTS = {
  'space-grey': { name: 'Space Grey', hex: '#3a3a3c', bodyHex: '#2c2c2e', metalHex: '#636366', accentHex: '#f5f5f7' },
  'white':      { name: 'Ceramic White', hex: '#f2f2f7', bodyHex: '#e5e5ea', metalHex: '#d1d1d6', accentHex: '#007aff' },
  'black':      { name: 'Onyx Black', hex: '#1c1c1e', bodyHex: '#121212', metalHex: '#3a3a3c', accentHex: '#30d158' },
};

export const DEVICE_CATALOG = {
  phones: [
    { id: 's24ultra',    name: 'Samsung Galaxy S24 Ultra', brand: 'Samsung', formFactor: 'bar',  defaultColor: 'space-grey' },
    { id: 's25ultra',    name: 'Samsung Galaxy S25 Ultra', brand: 'Samsung', formFactor: 'bar',  defaultColor: 'space-grey' },
    { id: 's26ultra',    name: 'Samsung Galaxy S26 Ultra', brand: 'Samsung', formFactor: 'bar',  defaultColor: 'black' },
    { id: 'zfold6',      name: 'Samsung Galaxy Z Fold 6',  brand: 'Samsung', formFactor: 'fold', defaultColor: 'space-grey' },
    { id: 'zflip6',      name: 'Samsung Galaxy Z Flip 6',  brand: 'Samsung', formFactor: 'flip', defaultColor: 'white' },
    { id: 'iphone17pro', name: 'iPhone 17 Pro',            brand: 'Apple',   formFactor: 'bar',  defaultColor: 'space-grey' },
    { id: 'iphone17air', name: 'iPhone 17 Air',            brand: 'Apple',   formFactor: 'bar',  defaultColor: 'white' },
    { id: 'iphone16pro', name: 'iPhone 16 Pro Max',        brand: 'Apple',   formFactor: 'bar',  defaultColor: 'space-grey' },
    { id: 'iphone16',    name: 'iPhone 16',                brand: 'Apple',   formFactor: 'bar',  defaultColor: 'black' },
    { id: 'iphone15pro', name: 'iPhone 15 Pro',            brand: 'Apple',   formFactor: 'bar',  defaultColor: 'white' },
    { id: 'iphone15',    name: 'iPhone 15',                brand: 'Apple',   formFactor: 'bar',  defaultColor: 'black' },
    { id: 'iphone12',    name: 'iPhone 12',                brand: 'Apple',   formFactor: 'bar',  defaultColor: 'white' },
  ],
  headphones: [
    { id: 'razerbarracuda', name: 'Razer Barracuda X 2.4G', brand: 'Razer', defaultColor: 'black' },
    { id: 'sonywh1000',     name: 'Sony WH-1000XM5',        brand: 'Sony',  defaultColor: 'black' },
    { id: 'airpodsmax',     name: 'AirPods Max',            brand: 'Apple', defaultColor: 'space-grey' },
  ],
  earbuds: [
    { id: 'airpodspro', name: 'AirPods Pro 2',    brand: 'Apple',   defaultColor: 'white' },
    { id: 'galaxybuds', name: 'Galaxy Buds 3 Pro', brand: 'Samsung', defaultColor: 'white' },
  ],
  speakers: [
    { id: 'soundbar', name: 'Samsung Soundbar & Subwoofer', brand: 'Samsung', defaultColor: 'space-grey' },
  ],
  controllers: [
    {
      id: 'ps5_controller',
      name: 'PlayStation 5 DualSense',
      brand: 'Sony',
      defaultColor: 'white',
      variants: null, // single model, no color switch
    },
    {
      id: 'xbox_controller',
      name: 'Xbox Wireless Controller',
      brand: 'Microsoft',
      defaultColor: 'white',
      // sub-models for color switch:
      variants: [
        { key: 'xbox_white', label: 'Robot White', glbId: 'xbox_white' },
        { key: 'xbox_black', label: 'Carbon Black', glbId: 'xbox_black' },
      ],
    },
  ],
};

export const ANIMATION_STYLES = {
  phone: [
    { id: 'amoled',    name: 'AMOLED Screen Ignition & Titanium Tilt' },
    { id: 'magsafe',   name: 'MagSafe Magnetic Snap & Energy Ripple' },
    { id: 'showcase',  name: '360° Vertical Showcase Flip' },
    { id: 'depth',     name: 'Dynamic Island Expansion & 3D Depth Float' },
    { id: 'hinge',     name: 'Foldable 180° Unfold & Dual Screen Flare' },
  ],
  controller: [
    { id: 'levitate',      name: '3D Levitation & Haptic Vibration Glow' },
    { id: 'flip-trigger',  name: '360° Trigger Flip & LED Pulse' },
  ],
  speaker: [
    { id: 'wave',      name: 'Sonic Equalizer Wave Sweep' },
    { id: 'panoramic', name: '360° Panoramic Soundstage Rotation' },
    { id: 'bass',      name: 'Subwoofer Bass Pulse & 3D Spin' },
  ],
  headphones: [
    { id: 'spin',   name: '360° Levitation Spin' },
    { id: 'expand', name: 'Acoustic Earcup Expand' },
  ],
  earbuds: [
    { id: 'case-dock', name: 'Lid Flip & Earbud Docking' },
    { id: 'float',     name: 'Dual Earbud Float' },
  ],
};

export function getDeviceById(id) {
  for (const cat of Object.keys(DEVICE_CATALOG)) {
    const found = DEVICE_CATALOG[cat].find((d) => d.id === id);
    if (found) return found;
  }
  return DEVICE_CATALOG.phones[0];
}

export function parseDeviceArchetype(deviceName = '') {
  const lower = deviceName.toLowerCase();
  if (lower.includes('dualsense') || lower.includes('playstation') || lower.includes('054c'))
    return { id: 'ps5_controller', name: deviceName, formFactor: 'controller', brand: 'Sony' };
  if (lower.includes('xbox') || lower.includes('xinput') || lower.includes('gamepad') || lower.includes('controller'))
    return { id: 'xbox_controller', name: deviceName, formFactor: 'controller', brand: 'Microsoft' };
  if (lower.includes('barracuda') || lower.includes('razer'))
    return { id: 'razerbarracuda', name: deviceName, formFactor: 'headphone', brand: 'Razer' };
  if (lower.includes('fold'))   return { id: 'zfold6',    name: deviceName, formFactor: 'fold', brand: 'Samsung' };
  if (lower.includes('flip'))   return { id: 'zflip6',    name: deviceName, formFactor: 'flip', brand: 'Samsung' };
  if (lower.includes('s26'))    return { id: 's26ultra',  name: deviceName, formFactor: 'bar',  brand: 'Samsung' };
  if (lower.includes('s25'))    return { id: 's25ultra',  name: deviceName, formFactor: 'bar',  brand: 'Samsung' };
  if (lower.includes('s24') || lower.includes('galaxy'))
    return { id: 's24ultra', name: deviceName, formFactor: 'bar', brand: 'Samsung' };
  if (lower.includes('iphone'))
    return { id: lower.includes('pro') ? 'iphone16pro' : 'iphone16', name: deviceName, formFactor: 'bar', brand: 'Apple' };
  return { id: 's24ultra', name: deviceName || 'Smartphone', formFactor: 'bar', brand: 'Generic' };
}

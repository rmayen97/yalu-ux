
export interface YumpiiBot {
  name: string;
  structure: {
    entry: string;
    states: YumpiiState[];
    globals: {
      keywords: string[];
      stateKey: string;
    }[];
    default: {
      text: string;
    };
  };
}

export interface YumpiiState {
  key: string;
  content: YumpiiContent[];
  transitions: YumpiiTransition[];
}

export interface YumpiiContent {
  type: 'text' | 'button' | 'list' | 'url_button' | 'location_request' | 'image' | 'video';
  value: any;
  caption?: string;
}

export interface YumpiiTransition {
  type: 'regex' | 'auto' | 'script' | 'type';
  value?: string;
  next?: string;
  position?: number;
  variable_replace?: Record<string, any>;
  params?: any;
}

export interface Message {
  id: string;
  type: 'bot' | 'user' | 'system';
  content: string;
  time: string;
  media?: string;
}

export interface Context {
  [key: string]: any;
}

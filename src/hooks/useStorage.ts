import { supabase } from '@/api/supabase';
import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

export const useStorage = () => {
  const uploadImage = async (uri: string, bucket: string = 'proofs') => {
    try {
      let fileData;
      const filePath = `${Date.now()}.png`;
      const contentType = 'image/png';

      if (Platform.OS === 'web') {
        const response = await fetch(uri);
        fileData = await response.blob();
      } else {
        const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
        fileData = decode(base64);
      }
      
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, fileData, { contentType });

      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  return { uploadImage };
};

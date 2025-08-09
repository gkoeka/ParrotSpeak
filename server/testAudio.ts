import { Request, Response } from 'express';

export async function testAudioEndpoint(req: Request, res: Response) {
  res.json({
    message: 'Audio test endpoint is working',
    timestamp: new Date().toISOString(),
    audioModuleInfo: {
      expoAvVersion: '15.1.7',
      recordingMethod: 'startAsync',
      note: 'This is the correct method name for Expo Audio Recording'
    }
  });
}
package com.brentvatne.exoplayer;

import android.util.Base64;

import java.io.BufferedInputStream;
import java.io.DataInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;

import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;

interface KeyGeneratedListener{
  void onKeysGenerated(SecretKeySpec key, IvParameterSpec ivParameterSpec);
  void ifKeyNotRequired();
}
public class GenerateCipherKeys extends Thread {

  private KeyGeneratedListener listener;
  private String parentDir;

  public GenerateCipherKeys(String parentFolder,KeyGeneratedListener listener){
    this.listener = listener;
    this.parentDir = parentFolder;
  }

  @Override
  public void run() {
    super.run();
    if (parentDir != null) {
      SecretKeyPair keyPair = formKey(new File(parentDir, ".prop"));
      if(keyPair != null) {
        SecretKeySpec mSecretKeySpec = keyPair.mSecretKeySpec;
        IvParameterSpec mIvParameterSpec = keyPair.mIvParameterSpec;
        listener.onKeysGenerated(mSecretKeySpec, mIvParameterSpec);
      }else
        listener.ifKeyNotRequired();
    }else
      listener.ifKeyNotRequired();
  }

  private SecretKeyPair formKey(File file) {
    int size = (int) file.length();
    byte[] bytes = new byte[size];
    try {
      BufferedInputStream buf = new BufferedInputStream(new FileInputStream(file));
      buf.read(bytes, 0, bytes.length);
      buf.close();
      bytes = Base64.decode(bytes,Base64.DEFAULT);
      String mergedKey = new StringBuilder(new String(bytes,"ISO-8859-1")).reverse().toString();
      String[] keyPairs = mergedKey.split("u#~#~y");
      SecretKeySpec key = new SecretKeySpec(keyPairs[0].getBytes("ISO-8859-1"),"AES");
      IvParameterSpec ivParams = new IvParameterSpec(keyPairs[1].getBytes("ISO-8859-1"));
      return new SecretKeyPair(key,ivParams);
    }catch (FileNotFoundException e){
      return null;
    }catch (Exception e){
      e.printStackTrace();
    }
    return null;
  }
  class SecretKeyPair{
    SecretKeySpec mSecretKeySpec;
    IvParameterSpec mIvParameterSpec;
    public SecretKeyPair(SecretKeySpec key,IvParameterSpec mIvParam){
      this.mSecretKeySpec = key;
      this.mIvParameterSpec = mIvParam;
    }
  }

}

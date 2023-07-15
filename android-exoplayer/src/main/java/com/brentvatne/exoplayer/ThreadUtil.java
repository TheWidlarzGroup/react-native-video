package com.brentvatne.exoplayer;

import android.os.Looper;
import android.os.Handler;

import com.google.android.exoplayer2.SimpleExoPlayer;

import java.util.concurrent.Callable;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.FutureTask;

public final class ThreadUtil {
    private ThreadUtil() {
    }

    public static boolean isOnApplicationThread(SimpleExoPlayer player) {
        return Looper.myLooper() == player.getApplicationLooper();
    }

    private static void executeOnApplicationHandler(SimpleExoPlayer player, Runnable task) {
        new Handler(getApplicationLooper(player)).post(task);
    }

    private static Looper getApplicationLooper(SimpleExoPlayer player) {
        return player.getApplicationLooper();
    }

    public static void executeOnApplicationThread(SimpleExoPlayer player, Runnable task) {
        if (player == null) {
            return;
        }
        if (isOnApplicationThread(player)) {
            task.run();
        } else {
            executeOnApplicationHandler(player, task);
        }
    }

    public static <T> T callOnApplicationThread(SimpleExoPlayer player, Callable<T> task) {
        if (player == null) {
            return null;
        }
        if (isOnApplicationThread(player)) {
            try {
                return task.call();
            } catch (Exception e) {
                e.printStackTrace();
                return null;
            }
        } else {
            return callOnApplicationHandler(player, task);
        }
    }

    private static <T> T callOnApplicationHandler(SimpleExoPlayer player, Callable<T> task) {
        Handler handler = new Handler(player.getApplicationLooper());
        FutureTask<T> futureTask = new FutureTask<>(task);

        handler.post(futureTask);

        try {
            return futureTask.get();
        } catch (InterruptedException | ExecutionException e) {
            e.printStackTrace();
            return null;
        }
    }

}

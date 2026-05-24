FROM ubuntu:20.04

ENV DEBIAN_FRONTEND=noninteractive \
    ANDROID_HOME=/opt/android-sdk \
    FLUTTER_HOME=/opt/flutter \
    PATH="${PATH}:/opt/flutter/bin:/opt/android-sdk/platform-tools:/opt/android-sdk/cmdline-tools/latest/bin"

RUN apt-get update && apt-get install -y \
    wget \
    curl \
    git \
    unzip \
    openjdk-17-jdk \
    libglu1-mesa \
    libstdc++6 \
    lib32z1 \
    libbz2-1.0 \
    zip \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir -p $ANDROID_HOME/cmdline-tools && \
    cd $ANDROID_HOME/cmdline-tools && \
    wget https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip -O tools.zip && \
    unzip tools.zip -d . && \
    rm tools.zip && \
    mv cmdline-tools latest && \
    chmod -R 755 $ANDROID_HOME/cmdline-tools/latest/bin/*

RUN git clone https://github.com/flutter/flutter.git -b stable --depth 1 $FLUTTER_HOME

RUN flutter precache --android

RUN yes | $ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager --licenses

RUN $ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager --install "platform-tools" "platforms;android-30" "build-tools;30.0.3" "emulator"

RUN flutter doctor -v

WORKDIR /app

COPY . /app

WORKDIR /app/mobile_client

RUN flutter pub get

RUN chmod +x $FLUTTER_HOME/bin/flutter

CMD ["/bin/sh", "-c", "flutter build apk --debug && cp build/app/outputs/flutter-apk/app-debug.apk /usr/src/app/common_volume/"]

import * as React from 'react';
import {
  Text,
  View,
  StyleSheet,
  Platform,
  ScrollView,
  TextInput,
  Alert,
  Button,
  ActivityIndicator,
} from 'react-native';
import Video, {DRMType, ReactVideoSourceProperties} from 'react-native-video';

type SourceType = ReactVideoSourceProperties | null;

const DRMExample = () => {
  const [loading, setLoading] = React.useState(false);

  const [source, setSource] = React.useState<SourceType>(null);

  const [hls, setHls] = React.useState(
    'https://d5lhbv70lxyop.cloudfront.net/02b91d1c-dcde-4a93-8391-8524f7836a72/assets/5a116d5e-4acb-4461-8bc0-81adf45a8432/videokit-576p-dash-hls-drm/hls/index.m3u8',
  );
  const [fairplayLicense, setFairplayLicense] = React.useState(
    'https://videokit-demo-7dr2zvpf.la.drm.cloud/acquire-license/fairplay?BrandGuid=02b91d1c-dcde-4a93-8391-8524f7836a72',
  );
  const [fairplayCertificate, setFairplayCertificate] = React.useState(
    'https://videokit-demo-7dr2zvpf.la.drm.cloud/certificate/fairplay?BrandGuid=02b91d1c-dcde-4a93-8391-8524f7836a72',
  );
  const [dash, setDash] = React.useState(
    'https://d5lhbv70lxyop.cloudfront.net/02b91d1c-dcde-4a93-8391-8524f7836a72/assets/5a116d5e-4acb-4461-8bc0-81adf45a8432/videokit-576p-dash-hls-drm/dash/index.mpd',
  );
  const [widevineLicense, setWidevineLicense] = React.useState(
    'https://videokit-demo-7dr2zvpf.la.drm.cloud/acquire-license/widevine?BrandGuid=02b91d1c-dcde-4a93-8391-8524f7836a72',
  );

  // ------------- DMR Token -------------
  // This token is used to authenticate the user and get the license
  // To run example please go to https://someweb.com (TODO: Insert here real website cc Kamil) and complete the form to receive the token
  // After you receive the token, please paste it here
  const [token, setToken] = React.useState('<USER_TOKEN>');

  const handlePlayStopVideo = () => {
    if (source !== null) {
      setSource(null);
      return;
    }

    if (token === '<USER_TOKEN>') {
      Alert.alert('Error', 'Please enter the token received from the website');
      return;
    }

    setLoading(true);

    const newSource: ReactVideoSourceProperties = {};

    if (Platform.OS === 'ios') {
      if (fairplayLicense && fairplayCertificate) {
        newSource.uri = hls;
        newSource.drm = {
          type: DRMType.FAIRPLAY,
          licenseServer: fairplayLicense,
          certificateUrl: fairplayCertificate,
          getLicense: (spcString, contentId, licenseUrl, loadedLicenseUrl) => {
            const formData = new FormData();
            formData.append('spc', spcString);

            const resultURL = loadedLicenseUrl.replace('skd://', 'https://');

            return fetch(`${resultURL}&userToken=${token}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'multipart/form-data',
                Accept: 'application/json',
              },
              body: formData,
            })
              .then((response) => response.json())
              .then((response) => {
                return response.ckc;
              })
              .catch((error) => {
                console.error('Error', error);
              });
          },
        };
      } else {
        Alert.alert('Error', 'Please enter Fairplay License and Certificate');
        setLoading(false);
      }
    }

    if (Platform.OS === 'android') {
      if (widevineLicense) {
        newSource.drm = {
          type: DRMType.WIDEVINE,
          licenseServer: widevineLicense,
        };
        newSource.uri = dash;
      } else {
        Alert.alert('Error', 'Please enter Widevine License');
        setLoading(false);
      }
    }

    setSource(newSource);
  };

  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    return (
      <View style={styles.container}>
        <Text>DRM is not supported on this platform</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>DRM Protected Stream Player</Text>

      {loading && <ActivityIndicator size="large" color="#0000ff" />}
      {source && source.uri && (
        <Video
          key={source.uri}
          onLoad={() => {
            setLoading(false);
          }}
          onError={(e) => {
            console.log('error', e);
            Alert.alert('Error', e.error.localizedDescription);
            setLoading(false);
          }}
          source={source}
          resizeMode="contain"
          style={styles.video}
          controls
          muted={false}
        />
      )}

      {Platform.OS === 'ios' && (
        <>
          <TextInput
            style={styles.input}
            placeholder="HLS URL"
            value={hls}
            onChangeText={(text) => setHls(text)}
          />

          <TextInput
            style={styles.input}
            placeholder="Fairplay License URL"
            value={fairplayLicense}
            onChangeText={(text) => setFairplayLicense(text)}
          />

          <TextInput
            style={styles.input}
            placeholder="Fairplay Certificate URL"
            value={fairplayCertificate}
            onChangeText={(text) => setFairplayCertificate(text)}
          />
        </>
      )}

      {Platform.OS === 'android' && (
        <>
          <TextInput
            style={styles.input}
            placeholder="DASH URL"
            value={dash}
            onChangeText={(text) => setDash(text)}
          />

          <TextInput
            style={styles.input}
            placeholder="Widevine License URL"
            value={widevineLicense}
            onChangeText={(text) => setWidevineLicense(text)}
          />
        </>
      )}

      <TextInput
        style={styles.input}
        placeholder="Token"
        value={token}
        onChangeText={(text) => setToken(text)}
      />

      <Button
        title={`${source !== null ? 'Stop' : 'Play'} Video`}
        onPress={handlePlayStopVideo}
      />
    </ScrollView>
  );
};

export default DRMExample;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'black',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: 'white',
  },
  video: {
    width: '100%',
    height: 200,
    marginBottom: 80,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    width: '100%',
    color: 'white',
  },
});

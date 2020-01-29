import escapeStringRegexp from 'escape-string-regexp';
import React from 'react';
import { Linking, View, ActivityIndicator, Text } from 'react-native';
import {
  WebViewNavigationEvent,
  OnShouldStartLoadWithRequest,
} from './WebViewTypes';
import styles from './WebView.styles';

const defaultOriginWhitelist = ['http://*', 'https://*'];

// const extractOrigin = (url: string): string => {
//   const result = /^[A-Za-z][A-Za-z0-9+\-.]+:(\/\/)?[^/]*/.exec(url);
//   return result === null ? '' : result.join('/');
// };

const originWhitelistToRegex = (originWhitelist: string): string =>
  `^${escapeStringRegexp(originWhitelist).replace(/\\\*/g, '.*')}`;

const passesWhitelist = (
  compiledWhitelist: readonly string[],
  url: string,
) => {
  // todo: fix regexp expression so that it won't cut off url parts
  // const origin = extractOrigin(url);
  return compiledWhitelist.some(x => new RegExp(x).test(url));
};

const compileWhitelist = (
  originWhitelist: readonly string[],
): readonly string[] =>
  ['about:blank', ...(originWhitelist || [])].map(originWhitelistToRegex);

const createOnShouldStartLoadWithRequest = (
  loadRequest: (
    shouldStart: boolean,
    url: string,
    lockIdentifier: number,
  ) => void,
  originWhitelist: readonly string[],
  onShouldStartLoadWithRequest?: OnShouldStartLoadWithRequest,
) => {
  return ({ nativeEvent }: WebViewNavigationEvent) => {
    let shouldStart = true;
    const { url, lockIdentifier } = nativeEvent;

    if (!passesWhitelist(compileWhitelist(originWhitelist), url)) {
      Linking.canOpenURL(url).then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        }
        console.warn(`Can't open url: ${url}`);
        return undefined;
      }).catch(e => {
        console.warn('Error opening URL: ', e);
      });
      shouldStart = false;
    } else if (onShouldStartLoadWithRequest) {
      shouldStart = onShouldStartLoadWithRequest(nativeEvent);
    }

    loadRequest(shouldStart, url, lockIdentifier);
  };
};

const defaultRenderLoading = () => (
  <View style={styles.loadingOrErrorView}>
    <ActivityIndicator />
  </View>
);
const defaultRenderError = (
  errorDomain: string | undefined,
  errorCode: number,
  errorDesc: string,
) => (
  <View style={styles.loadingOrErrorView}>
    <Text style={styles.errorTextTitle}>Error loading page</Text>
    <Text style={styles.errorText}>{`Domain: ${errorDomain}`}</Text>
    <Text style={styles.errorText}>{`Error Code: ${errorCode}`}</Text>
    <Text style={styles.errorText}>{`Description: ${errorDesc}`}</Text>
  </View>
);

export {
  defaultOriginWhitelist,
  createOnShouldStartLoadWithRequest,
  defaultRenderLoading,
  defaultRenderError,
};

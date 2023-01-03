/*
 *  This program is protected under international and U.S. copyright laws as
 *  an unpublished work. This program is confidential and proprietary to the
 *  copyright owners. Reproduction or disclosure, in whole or in part, or the
 *  production of derivative works therefrom without the express permission of
 *  the copyright owners is prohibited.
 *
 *                  Copyright © 2022 by Dolby Laboratories.
 *                          All rights reserved.
 *
 */

import {NativeModules} from 'react-native';
const {playbackBitrateEmitter} = NativeModules;

export interface playbackBitrateEmitterInterface {
}

export default playbackBitrateEmitter as playbackBitrateEmitterInterface;

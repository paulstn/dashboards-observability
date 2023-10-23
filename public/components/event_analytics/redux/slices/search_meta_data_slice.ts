/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createSlice, createSelector, PayloadAction } from '@reduxjs/toolkit';
import { initialTabId } from '../../../../framework/redux/store/shared_state';
import { REDUX_EXPL_SLICE_SEARCH_META_DATA } from '../../../../../common/constants/explorer';
import { SelectedDataSource } from '../../../../../common/types/explorer';

const cleanState = {
  lang: 'PPL',
  datasources: [],
  isPolling: false,
};

const initialState = {
  [initialTabId]: {
    ...cleanState,
  } as SearchMetaData,
};

interface SearchMetaData {
  lang: string;
  datasources: SelectedDataSource[];
  isPolling: boolean;
}

interface SearchMetaDataState {
  [key: string]: SearchMetaData;
}

interface UpdatePayload {
  tabId: string;
  data: Partial<SearchMetaData>;
}

export const searchMetaDataSlice = createSlice({
  name: REDUX_EXPL_SLICE_SEARCH_META_DATA,
  initialState,
  reducers: {
    update: (state, action: PayloadAction<UpdatePayload>) => {
      const { tabId, data } = action.payload;
      state[tabId] = {
        ...state[tabId],
        ...data,
      };
    },
    reset: (state, action: PayloadAction<{ tabId: string }>) => {
      const { tabId } = action.payload;
      state[tabId] = { ...cleanState };
    },
    init: (state, action: PayloadAction<{ tabId: string }>) => {
      const { tabId } = action.payload;
      state[tabId] = { ...cleanState };
    },
    remove: (state, action: PayloadAction<{ tabId: string }>) => {
      const { tabId } = action.payload;
      delete state[tabId];
    },
  },
});

export const { update, remove, init } = searchMetaDataSlice.actions;

export const selectSearchMetaData = createSelector(
  (state) => state.searchMetadata,
  (searchMetadata) => searchMetadata
);

export const searchMetaDataSliceReducer = searchMetaDataSlice.reducer;

export type { SearchMetaData, SearchMetaDataState, UpdatePayload };

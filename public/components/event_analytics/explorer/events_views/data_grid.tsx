/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState, useEffect, useRef, RefObject } from 'react';
import { EuiButtonIcon, EuiDataGrid } from '@elastic/eui';
import { IExplorerFields } from '../../../../../common/types/explorer';
import { DEFAULT_COLUMNS, PAGE_SIZE } from '../../../../../common/constants/explorer';
import { getHeaders, getTrs, populateDataGrid } from '../../utils';
import { HttpSetup } from '../../../../../../../src/core/public';
import PPLService from '../../../../services/requests/ppl';

interface DataGridProps {
  http: HttpSetup;
  pplService: PPLService;
  rows: any[];
  rowsAll: any[];
  explorerFields: IExplorerFields;
  timeStampField: string;
  rawQuery: string;
}

export function DataGrid(props: DataGridProps) {
  const { http, pplService, rows, rowsAll, explorerFields, timeStampField, rawQuery } = props;
  const [limit, setLimit] = useState(PAGE_SIZE);
  const loader = useRef<HTMLDivElement>(null);
  const [rowRefs, setRowRefs] = useState<
    Array<RefObject<{ closeAllFlyouts(openDocId: string): void }>>
  >([]);

  useEffect(() => {
    if (!loader.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) setLimit((alimit) => alimit + PAGE_SIZE);
      },
      {
        root: null,
        rootMargin: '500px',
        threshold: 0,
      }
    );
    observer.observe(loader.current);

    return () => observer.disconnect();
  }, [loader]);

  const onFlyoutOpen = (docId: string) => {
    rowRefs.forEach((rowRef) => {
      rowRef.current?.closeAllFlyouts(docId);
    });
  };

  const Queriedheaders = useMemo(() => getHeaders(explorerFields.queriedFields, DEFAULT_COLUMNS), [
    explorerFields.queriedFields,
  ]);
  const [QueriedtableRows, setQueriedtableRows] = useState<any[]>([]);
  useEffect(() => {
    setQueriedtableRows(
      getTrs(
        http,
        explorerFields.queriedFields,
        limit,
        setLimit,
        PAGE_SIZE,
        timeStampField,
        explorerFields,
        pplService,
        rawQuery,
        rowRefs,
        setRowRefs,
        onFlyoutOpen,
        rows
      )
    );
  }, [rows, explorerFields.queriedFields]);

  const headers = useMemo(() => getHeaders(explorerFields.selectedFields, DEFAULT_COLUMNS), [
    explorerFields.selectedFields,
  ]);
  const [tableRows, setTableRows] = useState<any[]>([]);
  useEffect(() => {
    const dataToRender =
      explorerFields?.queriedFields && explorerFields.queriedFields.length > 0 ? rowsAll : rows;
    setTableRows(
      getTrs(
        http,
        explorerFields.selectedFields,
        limit,
        setLimit,
        PAGE_SIZE,
        timeStampField,
        explorerFields,
        pplService,
        rawQuery,
        rowRefs,
        setRowRefs,
        onFlyoutOpen,
        dataToRender
      )
    );
  }, [rows, explorerFields.selectedFields]);

  useEffect(() => {
    setQueriedtableRows((prev) =>
      getTrs(
        http,
        explorerFields.queriedFields,
        limit,
        setLimit,
        PAGE_SIZE,
        timeStampField,
        explorerFields,
        pplService,
        rawQuery,
        rowRefs,
        setRowRefs,
        onFlyoutOpen,
        rows,
        prev
      )
    );
    const dataToRender =
      explorerFields?.queriedFields && explorerFields.queriedFields.length > 0 ? rowsAll : rows;
    setTableRows((prev) =>
      getTrs(
        http,
        explorerFields.selectedFields,
        limit,
        setLimit,
        PAGE_SIZE,
        timeStampField,
        explorerFields,
        pplService,
        rawQuery,
        rowRefs,
        setRowRefs,
        onFlyoutOpen,
        dataToRender,
        prev
      )
    );
  }, [limit]);

  const dataGridColumns = [
    {
      id: 'order_date',
      isSortable: true,
      display: 'Time',
      schema: 'datetime',
    },
    {
      id: '_source',
      isSortable: false,
      display: 'Source',
      schema: '_source',
    },
  ];

  const dataGridColumnVisibility = {
    visibleColumns: ['order_date', '_source'],
    setVisibleColumns: () => {},
  };

  const dataGridLeadingColumns = [
    {
      id: 'inspectCollapseColumn',
      headerCellRender: () => null,
      rowCellRender: () => {
        return (
          <EuiButtonIcon
            onClick={() => alert('popup opens')}
            iconType={'inspect'}
            aria-label="inspect document details"
          />
        );
      },
      width: 40,
    },
  ];

  return (
    <>
      {/* {populateDataGrid(explorerFields, Queriedheaders, QueriedtableRows, headers, tableRows)} */}
      <div className="dscTable dscTableFixedScroll">
        <EuiDataGrid
          aria-labelledby="aria-labelledby"
          columns={dataGridColumns}
          columnVisibility={dataGridColumnVisibility}
          leadingControlColumns={dataGridLeadingColumns}
          rowCount={100}
          renderCellValue={() => {
            return null;
          }}
        />
      </div>
      <div ref={loader} />
    </>
  );
}

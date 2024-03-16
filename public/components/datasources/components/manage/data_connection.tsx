/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiAccordion,
  EuiCard,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiPage,
  EuiPageBody,
  EuiPageHeader,
  EuiPageHeaderSection,
  EuiPanel,
  EuiSpacer,
  EuiTabbedContent,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import React, { useEffect, useState } from 'react';
import _ from 'lodash';
import {
  DATACONNECTIONS_BASE,
  INTEGRATIONS_BASE,
  observabilityIntegrationsID,
  observabilityLogsID,
  observabilityMetricsID,
} from '../../../../../common/constants/shared';
import { coreRefs } from '../../../../framework/core_refs';
import { getRenderCreateAccelerationFlyout } from '../../../../plugin';
import { NoAccess } from '../no_access';
import {
  DatasourceDetails,
  PrometheusProperties,
} from '../../../../../common/types/data_connections';
import { AssociatedObjectsTab } from './associated_objects/associated_objects_tab';
import { AccelerationTable } from './accelerations/acceleration_table';
import { AccessControlTab } from './access_control_tab';
import { InstalledIntegrationsTable } from './integrations/installed_integrations_table';
import {
  useLoadAccelerationsToCache,
  useLoadDatabasesToCache,
  useLoadTablesToCache,
} from '../../../../../public/framework/catalog_cache/cache_loader';
import { DATA_SOURCE_TYPES } from '../../../../../common/constants/data_sources';

const renderCreateAccelerationFlyout = getRenderCreateAccelerationFlyout();

export const DataConnection = (props: any) => {
  const { dataSource } = props;
  const [datasourceDetails, setDatasourceDetails] = useState<DatasourceDetails>({
    allowedRoles: [],
    name: '',
    description: '',
    connector: 'PROMETHEUS',
    properties: { 'prometheus.uri': 'placeholder' },
  });
  const [hasAccess, setHasAccess] = useState(true);
  const { http, chrome, application } = coreRefs;
  const [selectedDatabase, setSelectedDatabase] = useState<string>('');

  const {
    loadStatus: databasesLoadStatus,
    startLoading: startLoadingDatabases,
  } = useLoadDatabasesToCache();
  const { loadStatus: tablesLoadStatus, startLoading: startLoadingTables } = useLoadTablesToCache();
  const {
    loadStatus: accelerationsLoadStatus,
    startLoading: startLoadingAccelerations,
  } = useLoadAccelerationsToCache();

  const cacheLoadingHooks = {
    databasesLoadStatus,
    startLoadingDatabases,
    tablesLoadStatus,
    startLoadingTables,
    accelerationsLoadStatus,
    startLoadingAccelerations,
  };

  const [dataSourceIntegrations, setDataSourceIntegrations] = useState(
    [] as IntegrationInstanceResult[]
  );
  useEffect(() => {
    const searchDataSourcePattern = new RegExp(
      `flint_${_.escapeRegExp(datasourceDetails.name)}_default_.*_mview`
    );
    const findIntegrations = async () => {
      // TODO: we just get all results and filter, ideally we send a filtering query to the API
      // Should still be probably okay until we get cases of 500+ integration instances
      const result: { data: IntegrationInstancesSearchResult } = await http!.get(
        INTEGRATIONS_BASE + `/store`
      );
      if (result.data?.hits) {
        setDataSourceIntegrations(
          result.data.hits.filter((res) => res.dataSource.match(searchDataSourcePattern))
        );
      } else {
        setDataSourceIntegrations([]);
      }
    };
    findIntegrations();
  }, [http, datasourceDetails.name]);

  const onclickIntegrationsCard = () => {
    application!.navigateToApp(observabilityIntegrationsID);
  };

  const onclickAccelerationsCard = () => {
    renderCreateAccelerationFlyout(dataSource);
  };

  const onclickDiscoverCard = () => {
    application!.navigateToApp(observabilityLogsID, {
      path: `#/explorer`,
      state: {
        datasourceName: dataSource,
        datasourceType: DATA_SOURCE_TYPES.S3Glue,
      },
    });
  };

  const DefaultDatasourceCards = () => {
    return (
      <EuiFlexGroup>
        <EuiFlexItem>
          <EuiCard
            icon={<EuiIcon size="xxl" type="integrationGeneral" />}
            title={'Configure Integrations'}
            description="Connect to common application log types using integrations"
            onClick={onclickIntegrationsCard}
            selectable={{
              onClick: onclickIntegrationsCard,
              isDisabled: false,
              children: 'Add Integrations',
            }}
          />
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiCard
            icon={<EuiIcon size="xxl" type="bolt" />}
            title={'Accelerate performance'}
            description="Accelerate query performance through OpenSearch indexing"
            onClick={onclickAccelerationsCard}
            selectable={{
              onClick: onclickAccelerationsCard,
              isDisabled: false,
              children: 'Accelerate Performance',
            }}
          />
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiCard
            icon={<EuiIcon size="xxl" type="discoverApp" />}
            title={'Query data'}
            description="Uncover insights from your data or better understand it"
            onClick={onclickDiscoverCard}
            selectable={{
              onClick: onclickDiscoverCard,
              isDisabled: false,
              children: 'Query in Discover',
            }}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  };

  useEffect(() => {
    chrome!.setBreadcrumbs([
      {
        text: 'Data sources',
        href: '#/',
      },
      {
        text: `${dataSource}`,
        href: `#/manage/${dataSource}`,
      },
    ]);
    http!
      .get(`${DATACONNECTIONS_BASE}/${dataSource}`)
      .then((data) => {
        setDatasourceDetails({
          allowedRoles: data.allowedRoles,
          description: data.description,
          name: data.name,
          connector: data.connector,
          properties: data.properties,
        });
      })
      .catch((_err) => {
        setHasAccess(false);
      });
  }, [chrome, http]);

  const tabs = [
    {
      id: 'associated_objects',
      name: 'Associated Objects',
      disabled: false,
      content: (
        <AssociatedObjectsTab
          datasource={datasourceDetails}
          cacheLoadingHooks={cacheLoadingHooks}
          selectedDatabase={selectedDatabase}
          setSelectedDatabase={setSelectedDatabase}
        />
      ),
    },
    {
      id: 'acceleration_table',
      name: 'Accelerations',
      disabled: false,
      content: (
        <AccelerationTable dataSourceName={dataSource} cacheLoadingHooks={cacheLoadingHooks} />
      ),
    },
    {
      id: 'installed_integrations',
      name: 'Installed Integrations',
      disabled: false,
      content: <InstalledIntegrationsTable integrations={dataSourceIntegrations} />,
    },
    {
      id: 'access_control',
      name: 'Access control',
      disabled: false,
      content: (
        <AccessControlTab
          allowedRoles={datasourceDetails.allowedRoles}
          dataConnection={dataSource}
          connector={datasourceDetails.connector}
          properties={datasourceDetails.properties}
          key={JSON.stringify(datasourceDetails.allowedRoles)}
        />
      ),
    },
  ];

  const QueryOrAccelerateData = () => {
    switch (datasourceDetails.connector) {
      case 'S3GLUE':
        return <DefaultDatasourceCards />;
      case 'PROMETHEUS':
        // Prometheus does not have acceleration or integrations, and should go to metrics analytics
        return (
          <EuiFlexGroup>
            <EuiFlexItem>
              <EuiCard
                icon={<EuiIcon size="xxl" type="discoverApp" />}
                title={'Query data'}
                description="Query your data in Metrics Analytics."
                onClick={() => application!.navigateToApp(observabilityMetricsID)}
              />
            </EuiFlexItem>
          </EuiFlexGroup>
        );
      default:
        return <DefaultDatasourceCards />;
    }
  };

  const S3DatasourceOverview = () => {
    return (
      <EuiPanel>
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiFlexGroup direction="column">
              <EuiFlexItem grow={false}>
                <EuiText className="overview-title">Description</EuiText>
                <EuiText size="s" className="overview-content">
                  {datasourceDetails.description || '-'}
                </EuiText>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiFlexGroup direction="column">
              <EuiFlexItem grow={false}>
                <EuiText className="overview-title">Query Access</EuiText>
                <EuiText size="s" className="overview-content">
                  {datasourceDetails.allowedRoles.length > 0
                    ? `Restricted to ${datasourceDetails.allowedRoles.join(', ')}`
                    : 'Admin only'}
                </EuiText>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer />
      </EuiPanel>
    );
  };

  const PrometheusDatasourceOverview = () => {
    return (
      <EuiPanel>
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiFlexGroup direction="column">
              <EuiFlexItem grow={false}>
                <EuiText className="overview-title">Connection title</EuiText>
                <EuiText size="s" className="overview-content">
                  {datasourceDetails.name || '-'}
                </EuiText>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiText className="overview-title">Data source description</EuiText>
                <EuiText size="s" className="overview-content">
                  {datasourceDetails.description || '-'}
                </EuiText>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiFlexGroup direction="column">
              <EuiFlexItem grow={false}>
                <EuiText className="overview-title">Prometheus URI</EuiText>
                <EuiText size="s" className="overview-content">
                  {(datasourceDetails.properties as PrometheusProperties)['prometheus.uri'] || '-'}
                </EuiText>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer />
      </EuiPanel>
    );
  };

  const DatasourceOverview = () => {
    switch (datasourceDetails.connector) {
      case 'S3GLUE':
        return <S3DatasourceOverview />;
      case 'PROMETHEUS':
        return <PrometheusDatasourceOverview />;
    }
  };

  if (!hasAccess) {
    return <NoAccess />;
  }

  return (
    <EuiPage>
      <EuiPageBody>
        <EuiPageHeader style={{ justifyContent: 'spaceBetween' }}>
          <EuiPageHeaderSection style={{ width: '100%', justifyContent: 'space-between' }}>
            <EuiFlexGroup>
              <EuiFlexItem grow={false}>
                <EuiTitle data-test-subj="dataspirceTitle" size="l">
                  <h1>{dataSource}</h1>
                </EuiTitle>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiPageHeaderSection>
        </EuiPageHeader>

        <DatasourceOverview />
        <EuiSpacer />
        <EuiAccordion
          id="queryOrAccelerateAccordion"
          buttonContent={'Get started'}
          initialIsOpen={true}
          paddingSize="m"
        >
          <QueryOrAccelerateData />
        </EuiAccordion>
        <EuiTabbedContent tabs={tabs} />
        <EuiSpacer />
      </EuiPageBody>
    </EuiPage>
  );
};
export { DatasourceDetails };

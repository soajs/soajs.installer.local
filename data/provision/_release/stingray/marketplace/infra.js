"use strict";

module.exports = {
	type: "service",
	name: "infra",
	description: "This service handles everything related to soajs multi cloud Api and more",
	configuration: {
		group: "Console",
		subType: "soajs",
		port: 4008,
		requestTimeout: 30,
		requestTimeoutRenewal: 5
	},
	versions: [
		{
			version: "1",
			extKeyRequired: true,
			urac: true,
			urac_Profile: false,
			urac_ACL: false,
			urac_Config: false,
			urac_GroupConfig: false,
			tenant_Profile: false,
			provision_ACL: false,
			oauth: true,
			interConnect: [
				{
					name: "console",
					version: "1"
				}
			],
			maintenance: {
				readiness: "/heartbeat",
				port: {
					type: "maintenance"
				},
				commands: [
					{
						label: "Reload Registry",
						path: "/reloadRegistry",
						icon: "fas fa-undo"
					},
					{
						label: "Resource Info",
						path: "/resourceInfo",
						icon: "fas fa-info"
					}
				]
			},
			apis: [
				{
					l: "This API returns a deployment cd token.",
					v: "/cd/token",
					m: "get",
					group: "Token"
				},
				{
					l: "This API returns all the available deployment cd tokens.",
					v: "/cd/tokens",
					m: "get",
					group: "Token"
				},
				{
					l: "This API fetches the information of a plugin along with all its resources.",
					v: "/kubernetes/plugin",
					m: "get",
					group: "Kubernetes plugin"
				},
				{
					l: "This API fetches the information of a bundle deployment.",
					v: "/kubernetes/bundle",
					m: "get",
					group: "Kubernetes bundle"
				},
				{
					l: "This API returns the cluster information of a resource of mode (Node).",
					v: "/kubernetes/cluster/:mode",
					m: "get",
					group: "Kubernetes cluster"
				},
				{
					l: "This API returns the workloads information of a resource of mode (Deployment, DaemonSet, CronJob, Pod, HPA).",
					v: "/kubernetes/workload/:mode",
					m: "get",
					group: "Kubernetes workloads"
				},
				{
					l: "This API returns the services information of a resource of mode (Service).",
					v: "/kubernetes/service/:mode",
					m: "get",
					group: "Kubernetes services"
				},
				{
					l: "This API returns the storage information of a resource of mode (PVC, PV, StorageClass).",
					v: "/kubernetes/storage/:mode",
					m: "get",
					group: "Kubernetes storage"
				},
				{
					l: "This API returns the storage information of a resource of mode (Secret).",
					v: "/kubernetes/configuration/:mode",
					m: "get",
					group: "Kubernetes configuration"
				},
				{
					l: "This API returns the rbac information of a resource of mode (ClusterRole, ClusterRoleBinding, RoleBinding, APIService, ServiceAccount).",
					v: "/kubernetes/rbac/:mode",
					m: "get",
					group: "Kubernetes RBAC"
				},
				{
					l: "This API returns the cluster information of all resources of mode (Node).",
					v: "/kubernetes/clusters/:mode",
					m: "get",
					group: "Kubernetes cluster"
				},
				{
					l: "This API returns the workloads information of all resources of mode (Deployment, DaemonSet, CronJob, Pod, HPA).",
					v: "/kubernetes/workloads/:mode",
					m: "get",
					group: "Kubernetes workloads"
				},
				{
					l: "This API returns the services information of all resources of mode (Service).",
					v: "/kubernetes/services/:mode",
					m: "get",
					group: "Kubernetes services"
				},
				{
					l: "This API returns the storage information of all resources of mode (PVC, PV, StorageClass).",
					v: "/kubernetes/storages/:mode",
					m: "get",
					group: "Kubernetes storage"
				},
				{
					l: "This API returns the storage information of all resources of mode (Secret).",
					v: "/kubernetes/configurations/:mode",
					m: "get",
					group: "Kubernetes configuration"
				},
				{
					l: "This API returns the rbac information of all resources of mode (ClusterRole, ClusterRoleBinding, RoleBinding, APIService, ServiceAccount).",
					v: "/kubernetes/rbacs/:mode",
					m: "get",
					group: "Kubernetes RBAC"
				},
				{
					l: "This API fetches the latest version deployed of an item.",
					v: "/kubernetes/item/latestVersion",
					m: "get",
					group: "Kubernetes item"
				},
				{
					l: "This API fetches the container Logs and capable to tail the log if follow is set to true.",
					v: "/kubernetes/pod/log",
					m: "get",
					group: "Kubernetes workloads"
				},
				{
					l: "This API returns the item information meshed (Service, Deployment, DaemonSet, CronJob, and Pod).",
					v: "/kubernetes/item/inspect",
					m: "get",
					group: "Kubernetes item"
				},
				{
					l: "This API fetches the item metrics.",
					v: "/kubernetes/item/metrics",
					m: "get",
					group: "Kubernetes item"
				},
				{
					l: "This API fetches the container metrics.",
					v: "/kubernetes/pods/metrics",
					m: "get",
					group: "Kubernetes workloads"
				},
				{
					l: "This API fetches the node metrics.",
					v: "/kubernetes/nodes/metrics",
					m: "get",
					group: "Kubernetes cluster"
				},
				{
					l: "This API updates the status of a deployment cd token.",
					v: "/cd/token/status",
					m: "put",
					group: "Token"
				},
				{
					l: "This API scales a resource of type deployment only.",
					v: "/kubernetes/deployment/scale",
					m: "put",
					group: "Kubernetes item"
				},
				{
					l: "This API redeploys an item.",
					v: "/kubernetes/item/redeploy",
					m: "put",
					group: "Kubernetes item"
				},
				{
					l: "This API restarts a resource of type (Deployment, DaemonSet, or CronJob) and all its pod.",
					v: "/kubernetes/resource/restart",
					m: "put",
					group: "Kubernetes item"
				},
				{
					l: "This API trigger maintenance operation on a deployed item.",
					v: "/kubernetes/item/maintenance",
					m: "put",
					group: "Kubernetes item"
				},
				{
					l: "This API triggers maintenance operation in all the pods.",
					v: "/kubernetes/pods/exec",
					m: "put",
					group: "Kubernetes workloads"
				},
				{
					l: "This API triggers maintenance operation in a pod.",
					v: "/kubernetes/pod/exec",
					m: "put",
					group: "Kubernetes workloads"
				},
				{
					l: "This API updates a resource of mode (Deployment, DaemonSet, CronJob, HPA).",
					v: "/kubernetes/workload/:mode",
					m: "put",
					group: "Kubernetes workloads"
				},
				{
					l: "This API updates a resource of mode (Service).",
					v: "/kubernetes/service/:mode",
					m: "put",
					group: "Kubernetes services"
				},
				{
					l: "This API updates a resource of mode (PV, StorageClass).",
					v: "/kubernetes/storage/:mode",
					m: "put",
					group: "Kubernetes storage"
				},
				{
					l: "This API adds a deployment cd token.",
					v: "/cd/token",
					m: "post",
					group: "Token"
				},
				{
					l: "This API deploys a plugin along with all its resources.",
					v: "/kubernetes/plugin",
					m: "post",
					group: "Kubernetes plugin"
				},
				{
					l: "This API deploys a bundle deployment of resources.",
					v: "/kubernetes/bundle",
					m: "post",
					group: "Kubernetes bundle"
				},
				{
					l: "This API creates a resource of mode (Deployment, DaemonSet, CronJob, HPA. Pod).",
					v: "/kubernetes/workload/:mode",
					m: "post",
					group: "Kubernetes workloads"
				},
				{
					l: "This API creates a resource of mode (Service).",
					v: "/kubernetes/service/:mode",
					m: "post",
					group: "Kubernetes services"
				},
				{
					l: "This API creates a resource of mode (PVC, PV, StorageClass).",
					v: "/kubernetes/storage/:mode",
					m: "post",
					group: "Kubernetes storage"
				},
				{
					l: "This API creates a resource of mode (Secret).",
					v: "/kubernetes/configuration/:mode",
					m: "post",
					group: "Kubernetes configuration"
				},
				{
					l: "This API creates a resource of mode (ClusterRole, ClusterRoleBinding, RoleBinding, APIService, ServiceAccount).",
					v: "/kubernetes/rbac/:mode",
					m: "post",
					group: "Kubernetes RBAC"
				},
				{
					l: "This API creates a namespace.",
					v: "/kubernetes/namespace",
					m: "post",
					group: "Kubernetes environment"
				},
				{
					l: "This API creates an HPA.",
					v: "/kubernetes/item/hpa",
					m: "post",
					group: "Kubernetes item"
				},
				{
					l: "This API creates a secret.",
					v: "/kubernetes/secret",
					m: "post",
					group: "Kubernetes configuration wizard"
				},
				{
					l: "This API creates a secret for private image registry.",
					v: "/kubernetes/secret/registry",
					m: "post",
					group: "Kubernetes configuration wizard"
				},
				{
					l: "This API creates a PVC.",
					v: "/kubernetes/pvc",
					m: "post",
					group: "Kubernetes storage wizard"
				},
				{
					l: "This API deploys an item from the catalog using soajs recipe of type Deployment or DaemonSet.",
					v: "/kubernetes/item/deploy/soajs",
					m: "post",
					group: "Kubernetes item"
				},
				{
					l: "This API deploys an item from the catalog using soajs recipe of type CronJob.",
					v: "/kubernetes/item/deploy/soajs/conjob",
					m: "post",
					group: "Kubernetes item"
				},
				{
					l: "This API deploys an item from the catalog using kubernetes native recipe of type Deployment or DaemonSet.",
					v: "/kubernetes/item/deploy/native",
					m: "post",
					group: "Kubernetes item"
				},
				{
					l: "This API deploys an item from the catalog using kubernetes native recipe of type CronJob.",
					v: "/kubernetes/item/deploy/native/cronjob",
					m: "post",
					group: "Kubernetes item"
				},
				{
					l: "This API creates the service and the related Deployment, DaemonSet or CronJob.",
					v: "/kubernetes/deploy/native",
					m: "post",
					group: "Kubernetes item"
				},
				{
					l: "This API deletes a deployment cd token.",
					v: "/cd/token",
					m: "delete",
					group: "Token"
				},
				{
					l: "This API deletes a plugin along with all its resources.",
					v: "/kubernetes/plugin",
					m: "delete",
					group: "Kubernetes plugin"
				},
				{
					l: "This API removes all the resources of a deployed bundle.",
					v: "/kubernetes/bundle",
					m: "delete",
					group: "Kubernetes bundle"
				},
				{
					l: "This API deletes a resource of mode (Deployment, DaemonSet, CronJob, HPA).",
					v: "/kubernetes/workload/:mode",
					m: "delete",
					group: "Kubernetes workloads"
				},
				{
					l: "This API deletes a resource of mode (Service).",
					v: "/kubernetes/service/:mode",
					m: "delete",
					group: "Kubernetes services"
				},
				{
					l: "This API deletes a resource of mode (PVC, PV, StorageClass).",
					v: "/kubernetes/storage/:mode",
					m: "delete",
					group: "Kubernetes storage"
				},
				{
					l: "This API deletes a resource of mode (Secret).",
					v: "/kubernetes/configuration/:mode",
					m: "delete",
					group: "Kubernetes configuration"
				},
				{
					l: "This API deletes a resource of mode (ClusterRole, ClusterRoleBinding, RoleBinding, APIService, ServiceAccount).",
					v: "/kubernetes/rbac/:mode",
					m: "delete",
					group: "Kubernetes RBAC"
				},
				{
					l: "This API deletes pods.",
					v: "/kubernetes/pods",
					m: "delete",
					group: "Kubernetes workloads"
				},
				{
					l: "This API deletes a namespace.",
					v: "/kubernetes/namespace",
					m: "delete",
					group: "Kubernetes environment"
				},
				{
					l: "This API deletes an item of type (Deployment, DaemonSet  or CronJob) as well as the related HPA with the related service.",
					v: "/kubernetes/item",
					m: "delete",
					group: "Kubernetes item"
				}
			]
		}
	]
};
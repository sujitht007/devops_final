pipeline {
    agent any
    environment {
        DOCKER_HUB = "sujitht007"
        KUBECONFIG = "C:\\Users\\LENOVO\\.kube\\config"
    }
    stages {
        stage('Checkout SCM') {
            steps {
                git url: 'https://github.com/sujitht007/devops_final.git', 
                    branch: 'main', 
                    credentialsId: 'dockerhub-pass'
            }
        }
        stage('Install Dependencies') {
            steps {
                bat 'npm install'
            }
        }
        stage('Build & Push Docker Images') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'dockerhub-pass', 
                                                 usernameVariable: 'DOCKER_USER', 
                                                 passwordVariable: 'DOCKER_PASS')]) {
                    bat "docker login -u %DOCKER_USER% -p %DOCKER_PASS%"
                    bat "docker build --build-arg SERVICE=cart-service -t %DOCKER_HUB%/cart-service:latest ."
                    bat "docker build --build-arg SERVICE=product-service -t %DOCKER_HUB%/product-service:latest ."
                    bat "docker build --build-arg SERVICE=gateway -t %DOCKER_HUB%/gateway:latest ."
                    bat "docker build --build-arg SERVICE=metrics-service -t %DOCKER_HUB%/metrics-service:latest ."
                    bat "docker push %DOCKER_HUB%/cart-service:latest"
                    bat "docker push %DOCKER_HUB%/product-service:latest"
                    bat "docker push %DOCKER_HUB%/gateway:latest"
                    bat "docker push %DOCKER_HUB%/metrics-service:latest"
                }
            }
        }
        stage('Deploy to Kubernetes') {
            steps {
                bat 'kubectl apply -f k8s/ --validate=false --kubeconfig="C:\\Users\\LENOVO\\.kube\\config"'
                bat 'kubectl rollout restart deployment/cart-deployment --kubeconfig="C:\\Users\\LENOVO\\.kube\\config"'
                bat 'kubectl rollout restart deployment/product-deployment --kubeconfig="C:\\Users\\LENOVO\\.kube\\config"'
                bat 'kubectl rollout restart deployment/gateway-deployment --kubeconfig="C:\\Users\\LENOVO\\.kube\\config"'
                bat 'kubectl rollout restart deployment/metrics-deployment --kubeconfig="C:\\Users\\LENOVO\\.kube\\config"'
                bat 'kubectl rollout status deployment/cart-deployment --kubeconfig="C:\\Users\\LENOVO\\.kube\\config"'
                bat 'kubectl rollout status deployment/product-deployment --kubeconfig="C:\\Users\\LENOVO\\.kube\\config"'
                bat 'kubectl rollout status deployment/gateway-deployment --kubeconfig="C:\\Users\\LENOVO\\.kube\\config"'
                bat 'kubectl rollout status deployment/metrics-deployment --kubeconfig="C:\\Users\\LENOVO\\.kube\\config"'
            }
        }
    }
    post {
        always {
            bat 'docker logout'
        }
    }
}

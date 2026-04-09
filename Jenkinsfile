pipeline {
    agent any
    environment {
        IMAGE_NAME = "microservice-app"
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
        stage('Build & Push Docker Image') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'dockerhub-pass', 
                                                 usernameVariable: 'DOCKER_USER', 
                                                 passwordVariable: 'DOCKER_PASS')]) {
                    bat "docker login -u %DOCKER_USER% -p %DOCKER_PASS%"
                    bat "docker build -t %DOCKER_HUB%/%IMAGE_NAME%:latest ."
                    bat "docker push %DOCKER_HUB%/%IMAGE_NAME%:latest"
                }
            }
        }
        stage('Deploy to Kubernetes') {
            steps {
                bat 'kubectl apply -f k8s/ --validate=false --kubeconfig="C:\\Users\\LENOVO\\.kube\\config"'
                bat 'kubectl rollout status deployment/microservice-deployment --kubeconfig="C:\\Users\\LENOVO\\.kube\\config"'
            }
        }
    }
    post {
        always {
            bat 'docker logout'
        }
    }
}
